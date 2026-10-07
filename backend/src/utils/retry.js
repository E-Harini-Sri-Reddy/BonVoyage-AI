export async function withRetry(fn, { retries = 2, delayMs = 800 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error.response?.status === 429 ||
        error.response?.status >= 500 ||
        error.code === 'ECONNABORTED';

      if (!isRetryable || attempt === retries) break;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

export function extractErrorMessage(error, fallback = 'Request failed') {
  const data = error.response?.data;

  if (typeof data === 'string') return data;

  return (
    data?.message ||
    data?.error?.message ||
    data?.error ||
    (data?.statusCode && data?.message ? data.message : null) ||
    error.message ||
    fallback
  );
}
