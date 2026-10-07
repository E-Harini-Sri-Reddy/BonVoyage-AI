import axios from 'axios';
import { getCached, setCache, hasCached } from '../utils/cache.js';

const WIKI_HEADERS = {
  'User-Agent': 'BonVoyageAI/1.0 (https://github.com/bonvoyage-ai; educational travel app)',
};

function normalizeTitle(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreWikiTitle(title, placeName, category) {
  const t = normalizeTitle(title);
  const place = normalizeTitle(placeName);
  const words = place.split(' ').filter((w) => w.length > 3);

  let score = 0;
  if (t === place) score += 50;
  if (t.startsWith(place) || place.startsWith(t.split(',')[0]?.trim() || '')) score += 30;

  for (const word of words) {
    if (t.includes(word)) score += 10;
  }

  if (category === 'Museum' && t.includes('museum')) score += 12;
  if (category === 'Park' && (t.includes('park') || t.includes('square') || t.includes('garden'))) score += 12;
  if (category === 'Landmark' && (t.includes('church') || t.includes('basil') || t.includes('cathedral') || t.includes('hotel') || t.includes('palace') || t.includes('monument') || t.includes('statue') || t.includes('memorial'))) score += 8;
  if (category === 'Landmark' && (t.includes('statue') || t.includes('memorial') || t.includes('monument'))) score += 18;

  if (t.includes('station') && !place.includes('station')) score -= 25;
  if (t.includes('list of') || t.includes('embassy of')) score -= 20;
  if (t.includes('birth') || t.includes('death') || t.includes('biography') || t.includes('politician')) score -= 35;

  return score;
}

function isLikelyPersonLandmark(placeName, category) {
  if (category !== 'Landmark') return false;
  const place = normalizeTitle(placeName);
  const venueWords = ['museum', 'park', 'temple', 'church', 'station', 'airport', 'hotel', 'palace', 'fort', 'gate', 'market', 'square', 'garden', 'beach', 'bridge', 'tower', 'hall', 'stadium', 'statue', 'memorial'];
  if (venueWords.some((w) => place.includes(w))) return false;
  const words = place.split(' ').filter((w) => w.length > 2);
  return words.length >= 1 && words.length <= 4;
}

function isWeakMatch(score) {
  return score < 8;
}

async function fetchGeoPhotoCandidates(lat, lon, site, placeName, category, radius = 250) {
  const { data } = await axios.get(`https://${site}/w/api.php`, {
    params: {
      action: 'query',
      format: 'json',
      generator: 'geosearch',
      ggscoord: `${lat}|${lon}`,
      ggsradius: radius,
      ggslimit: 12,
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: 640,
    },
    headers: WIKI_HEADERS,
    timeout: 5000,
  });

  return Object.values(data?.query?.pages || {})
    .filter((page) => page.thumbnail?.source)
    .map((page) => ({
      url: page.thumbnail.source,
      title: page.title,
      score: scoreWikiTitle(page.title, placeName, category),
    }))
    .sort((a, b) => b.score - a.score);
}

async function fetchWikipediaCandidates(searchTerm) {
  const { data } = await axios.get('https://en.wikipedia.org/w/api.php', {
    params: {
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: searchTerm,
      gsrlimit: 4,
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: 640,
    },
    headers: WIKI_HEADERS,
    timeout: 5000,
  });

  const pages = data?.query?.pages;
  if (!pages) return [];

  return Object.values(pages)
    .filter((page) => page.pageid !== -1 && page.thumbnail?.source)
    .map((page) => ({
      url: page.thumbnail.source,
      title: page.title,
      score: 0,
    }));
}

function pickUniquePhoto(candidates, placeName, category, usedUrls) {
  const ranked = candidates
    .map((c) => ({ ...c, score: c.score ?? scoreWikiTitle(c.title, placeName, category) }))
    .sort((a, b) => b.score - a.score);

  const strong = ranked.find((c) => !usedUrls.has(c.url) && !isWeakMatch(c.score));
  if (strong) return strong;

  const anyUnused = ranked.find((c) => !usedUrls.has(c.url));
  return anyUnused || null;
}

async function getPlacePhotoUrl(place, city = '', usedUrls = new Set()) {
  const cacheKey = `place-photo-v3:${place.name}:${place.lat}:${place.lon}:${city}`.toLowerCase();
  if (hasCached(cacheKey)) {
    const cached = getCached(cacheKey);
    if (cached && !usedUrls.has(cached)) {
      usedUrls.add(cached);
      return cached;
    }
    if (!cached) return null;
  }

  // One tight search first — avoid multi-query waterfall
  const primaryQuery = isLikelyPersonLandmark(place.name, place.category)
    ? `"${place.name}" statue ${city}`.trim()
    : `"${place.name}" ${city}`.trim();

  let candidates = [];
  try {
    const results = await fetchWikipediaCandidates(primaryQuery || place.name);
    for (const result of results) {
      result.score = scoreWikiTitle(result.title, place.name, place.category);
    }
    candidates.push(...results);
  } catch {
    // ignore
  }

  let picked = pickUniquePhoto(candidates, place.name, place.category, usedUrls);
  if (!picked && place.lat != null && place.lon != null) {
    try {
      const geoCandidates = await fetchGeoPhotoCandidates(
        place.lat,
        place.lon,
        'en.wikipedia.org',
        place.name,
        place.category,
        500
      );
      candidates.push(...geoCandidates);
      picked = pickUniquePhoto(candidates, place.name, place.category, usedUrls);
    } catch {
      // ignore
    }
  }

  const photo = picked?.url || null;
  setCache(cacheKey, photo || '', 7 * 86400);
  if (photo) usedUrls.add(photo);
  return photo;
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

/**
 * Fast photo enrichment: top N places, parallel pool, 1–2 wiki calls each.
 */
export async function enrichPlacesWithPhotos(places, city = '', { limit = 6, concurrency = 3 } = {}) {
  if (!places?.length) return places;

  const usedUrls = new Set();
  const toEnrich = places.slice(0, limit);
  const rest = places.slice(limit);

  const enriched = await mapPool(toEnrich, concurrency, async (place) => {
    if (place.imageUrl && !place.imageUrl.includes('staticmap') && !usedUrls.has(place.imageUrl)) {
      usedUrls.add(place.imageUrl);
      return place;
    }
    try {
      const photo = await getPlacePhotoUrl(place, city, usedUrls);
      return { ...place, imageUrl: photo || null };
    } catch {
      return { ...place, imageUrl: null };
    }
  });

  return [...enriched, ...rest.map((p) => ({ ...p, imageUrl: p.imageUrl || null }))];
}
