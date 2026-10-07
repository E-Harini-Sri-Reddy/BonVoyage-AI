import axios from 'axios';
import { env } from '../config/env.js';
import { getCached, setCache } from '../utils/cache.js';

const GROQ_QUOTA_KEY = 'groq:quota-exceeded';

const client = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  timeout: 45000,
  headers: {
    Authorization: `Bearer ${env.groqApiKey}`,
    'Content-Type': 'application/json',
  },
});

function parseRetryAfterSeconds(message = '') {
  const match = message.match(/try again in (?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
  if (!match) return 3600;
  const minutes = Number(match[1] || 0);
  const seconds = Number(match[2] || 0);
  return Math.max(300, Math.ceil(minutes * 60 + seconds));
}

export function isGroqRateLimited() {
  return Boolean(getCached(GROQ_QUOTA_KEY));
}

function extractFailedGeneration(error) {
  return (
    error.response?.data?.error?.failed_generation ||
    error.response?.data?.failed_generation ||
    null
  );
}

export async function chatCompletion({ messages, temperature = 0.3, maxTokens = 4096 }) {
  if (isGroqRateLimited()) {
    throw new Error('Groq rate limit active — using cached results. Please try again later.');
  }

  try {
    const { data } = await client.post('/chat/completions', {
      model: env.groqModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });
    return data.choices[0]?.message?.content || '{}';
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message;
    if (/rate limit|429|tokens per day/i.test(msg)) {
      setCache(GROQ_QUOTA_KEY, true, parseRetryAfterSeconds(msg));
    }

    const failed = extractFailedGeneration(error);
    if (failed) {
      const err = new Error(msg);
      err.failedGeneration = failed;
      err.isJsonValidation = /validate json|failed_generation|json/i.test(msg);
      throw err;
    }
    throw new Error(msg);
  }
}

/** Best-effort parse of truncated / slightly invalid model JSON */
export function parseJsonResponse(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty AI response');

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to close truncated objects/arrays
    let attempt = cleaned;
    const openCurly = (attempt.match(/\{/g) || []).length;
    const closeCurly = (attempt.match(/\}/g) || []).length;
    const openSquare = (attempt.match(/\[/g) || []).length;
    const closeSquare = (attempt.match(/\]/g) || []).length;

    // Strip trailing incomplete key/value
    attempt = attempt.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
    attempt = attempt.replace(/,\s*$/, '');

    for (let i = 0; i < openSquare - closeSquare; i += 1) attempt += ']';
    for (let i = 0; i < openCurly - closeCurly; i += 1) attempt += '}';

    try {
      return JSON.parse(attempt);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          // fall through
        }
      }
      throw new Error('Failed to parse AI response');
    }
  }
}
