const LOCALE_BY_CURRENCY = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', INR: 'en-IN',
  AUD: 'en-AU', CAD: 'en-CA', JPY: 'ja-JP', AED: 'en-AE',
  SGD: 'en-SG', CHF: 'de-CH',
};

export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(amount)) return '—';
  const locale = LOCALE_BY_CURRENCY[currency] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 0,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(fromDate, toDate) {
  return `${formatDate(fromDate)} — ${formatDate(toDate)}`;
}

export function getTripDuration(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}
