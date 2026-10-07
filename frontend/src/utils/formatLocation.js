export function shortLocation(label, max = 28) {
  if (!label) return '';
  if (label.length <= max) return label;

  const iata = label.match(/\(([A-Z]{3})\)/);
  if (iata) return iata[1];

  const firstPart = label.split(',')[0].trim();
  if (firstPart.length <= max) return firstPart;

  return `${firstPart.slice(0, max - 1)}…`;
}
