/** Common IATA codes when Sky Scrapper is unavailable or quota is exceeded */
export const IATA_BY_CODE = {
  JFK: 'JFK',
  LGA: 'LGA',
  EWR: 'EWR',
  CDG: 'CDG',
  ORY: 'ORY',
  LHR: 'LHR',
  LGW: 'LGW',
  HYD: 'HYD',
  DEL: 'DEL',
  BOM: 'BOM',
  DXB: 'DXB',
  SIN: 'SIN',
  NRT: 'NRT',
  HND: 'HND',
  LAX: 'LAX',
  SFO: 'SFO',
  ORD: 'ORD',
  MIA: 'MIA',
  BKK: 'BKK',
  FCO: 'FCO',
  AMS: 'AMS',
  BER: 'BER',
  MAD: 'MAD',
  BCN: 'BCN',
};

export const IATA_BY_CITY = {
  'new york': 'JFK',
  paris: 'CDG',
  london: 'LHR',
  hyderabad: 'HYD',
  delhi: 'DEL',
  mumbai: 'BOM',
  dubai: 'DXB',
  singapore: 'SIN',
  tokyo: 'NRT',
  'los angeles': 'LAX',
  'san francisco': 'SFO',
  chicago: 'ORD',
  miami: 'MIA',
  bangkok: 'BKK',
  rome: 'FCO',
  amsterdam: 'AMS',
  berlin: 'BER',
  madrid: 'MAD',
  barcelona: 'BCN',
};

export function lookupIataCode(query) {
  if (!query) return null;
  const text = query.trim();

  const paren = text.match(/\(([A-Z]{3})\)/);
  if (paren && IATA_BY_CODE[paren[1]]) return paren[1];

  const iata = text.match(/\b([A-Z]{3})\b/);
  if (iata && IATA_BY_CODE[iata[1]]) return iata[1];

  const lower = text.toLowerCase();
  for (const [city, code] of Object.entries(IATA_BY_CITY)) {
    if (lower.includes(city)) return code;
  }

  return null;
}
