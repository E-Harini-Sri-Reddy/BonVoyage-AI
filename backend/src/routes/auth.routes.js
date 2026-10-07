import { Router } from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  validatePassword,
  validateEmail,
} from '../services/auth.service.js';
import { authenticate, optionalAuth, requireAuth } from '../middleware/auth.js';
import { setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { Favorite, RecentSearch, Trip, PackingList } from '../models/index.js';
import { buildTripKey } from '../models/schemas.js';
import { isDBConnected, getDbName } from '../config/database.js';
import { toUserObjectId } from '../utils/userId.js';

const router = Router();

function formatFavorite(doc) {
  return {
    id: doc.itemId,
    itemId: doc.itemId,
    type: doc.type,
    title: doc.title,
    subtitle: doc.subtitle,
    data: doc.data,
    createdAt: doc.createdAt,
  };
}

function normalizeTripInput(raw = {}) {
  return {
    origin: String(raw.origin || '').trim(),
    destination: String(raw.destination || '').trim(),
    fromDate: String(raw.fromDate || ''),
    toDate: String(raw.toDate || ''),
    travellers: Number(raw.travellers) || 1,
    budget: Number(raw.budget) || 0,
    currency: raw.currency || 'USD',
    tripType: raw.tripType || 'solo',
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    travellingWithPets: Boolean(raw.travellingWithPets),
    travellingWithDisabilities: Boolean(raw.travellingWithDisabilities),
  };
}

function validateTripInput(input) {
  if (!input.origin || !input.destination || !input.fromDate) {
    throw new AppError('Trip requires origin, destination, and start date', 400);
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) throw new AppError('Name is required', 400);
    validateEmail(email);
    validatePassword(password);

    const { user, token } = await registerUser({ name: name.trim(), email, password });
    setAuthCookie(res, token);
    res.status(201).json({ success: true, user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    validateEmail(email);
    if (!password) throw new AppError('Password is required', 400);

    const { user, token } = await loginUser({ email, password });
    setAuthCookie(res, token);
    res.json({ success: true, user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) throw new AppError('Google credential required', 400);

    const { user, token } = await googleAuth(credential);
    setAuthCookie(res, token);
    res.json({ success: true, user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get('/me', optionalAuth, (req, res) => {
  res.json({ success: true, user: req.user || null });
});

// --- User data routes (require auth) ---

router.get('/favorites', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ favorites: [] });
    const userId = toUserObjectId(req.user);
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    res.json({ favorites: favorites.map(formatFavorite) });
  } catch (error) {
    next(error);
  }
});

router.post('/favorites', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Sign in to save favorites', 403);
    const userId = toUserObjectId(req.user);
    const { type, itemId, title, subtitle, data } = req.body;
    if (!type || !itemId) throw new AppError('Favorite type and itemId are required', 400);

    const fav = await Favorite.findOneAndUpdate(
      { userId, itemId },
      { type, title, subtitle, data },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, favorite: formatFavorite(fav) });
  } catch (error) {
    next(error);
  }
});

router.delete('/favorites/:itemId', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Sign in required', 403);
    const userId = toUserObjectId(req.user);
    await Favorite.deleteOne({ userId, itemId: req.params.itemId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/recent', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ searches: [] });
    const userId = toUserObjectId(req.user);
    const searches = await RecentSearch.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    res.json({
      searches: searches.map((s) => ({
        id: s._id,
        ...s.search,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/recent', authenticate, requireAuth, async (req, res, next) => {
  try {
    const userId = toUserObjectId(req.user);
    await RecentSearch.deleteMany({ userId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/recent/:id', authenticate, requireAuth, async (req, res, next) => {
  try {
    const userId = toUserObjectId(req.user);
    await RecentSearch.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/recent', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ success: true, saved: false });
    const userId = toUserObjectId(req.user);
    const search = normalizeTripInput(req.body.search);
    validateTripInput(search);

    await RecentSearch.deleteMany({
      userId,
      'search.origin': search.origin,
      'search.destination': search.destination,
      'search.fromDate': search.fromDate,
    });

    const doc = await RecentSearch.create({ userId, search });
    const count = await RecentSearch.countDocuments({ userId });
    if (count > 10) {
      const oldest = await RecentSearch.find({ userId }).sort({ createdAt: 1 }).limit(count - 10);
      await RecentSearch.deleteMany({ _id: { $in: oldest.map((o) => o._id) } });
    }
    res.json({ success: true, saved: true, search: { id: doc._id, ...search } });
  } catch (error) {
    next(error);
  }
});

router.get('/trips', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ trips: [] });
    const userId = toUserObjectId(req.user);
    const trips = await Trip.find({ userId }).sort({ updatedAt: -1 }).limit(20).lean();
    res.json({
      trips: trips.map((t) => ({
        id: t._id,
        tripKey: t.tripKey,
        title: t.title,
        input: t.input,
        plan: t.plan,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/trips', authenticate, requireAuth, async (req, res, next) => {
  try {
    if (!isDBConnected()) throw new AppError('Database not available. Check MONGODB_URI in backend/.env', 503);

    const userId = toUserObjectId(req.user);
    const input = normalizeTripInput(req.body.input);
    validateTripInput(input);
    const { title, plan } = req.body;
    const tripKey = buildTripKey(input);

    const trip = await Trip.findOneAndUpdate(
      { userId, tripKey },
      {
        title: title || `${input.origin} → ${input.destination}`,
        input,
        plan: plan || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      trip: {
        id: trip._id,
        tripKey: trip.tripKey,
        title: trip.title,
        input: trip.input,
        plan: trip.plan,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/trips/:id', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Sign in required', 403);
    const userId = toUserObjectId(req.user);
    await Trip.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/packing/:tripKey', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ checked: {} });
    const userId = toUserObjectId(req.user);
    const doc = await PackingList.findOne({ userId, tripKey: req.params.tripKey }).lean();
    res.json({ checked: doc?.checked || {} });
  } catch (error) {
    next(error);
  }
});

router.put('/packing/:tripKey', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ success: true, saved: false });
    const userId = toUserObjectId(req.user);
    const { checked } = req.body;
    if (!req.params.tripKey) throw new AppError('Trip key is required', 400);

    await PackingList.findOneAndUpdate(
      { userId, tripKey: req.params.tripKey },
      { checked: checked || {} },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, saved: true });
  } catch (error) {
    next(error);
  }
});

router.get('/status', (_req, res) => {
  res.json({
    dbConnected: isDBConnected(),
    database: getDbName(),
    collections: ['users', 'saved_trips', 'favorites', 'recent_searches', 'packing_lists'],
  });
});

export default router;
