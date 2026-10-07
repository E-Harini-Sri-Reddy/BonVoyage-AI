import { useEffect, useRef } from 'react';
import { useTrip } from '../context/TripContext';
import { detectCurrency } from '../services/geoApi';
import { CURRENCY_CODES } from '../constants/currencies';

const DETECTED_KEY = 'bonvoyage_currency_detected';

/**
 * Auto-select currency from IP / locale once per browser session,
 * unless the user has already chosen a different currency.
 */
export function useDetectCurrency() {
  const { input, setInput } = useTrip();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (sessionStorage.getItem(DETECTED_KEY)) return;
    // Only auto-set when still on the form default
    if (input.currency && input.currency !== 'USD') {
      sessionStorage.setItem(DETECTED_KEY, input.currency);
      return;
    }

    ran.current = true;
    detectCurrency()
      .then(({ data }) => {
        const currency = data?.currency;
        if (currency && CURRENCY_CODES.includes(currency)) {
          setInput({ currency });
          sessionStorage.setItem(DETECTED_KEY, currency);
        }
      })
      .catch(() => {
        // Keep default if geo lookup fails
      });
  }, [input.currency, setInput]);
}
