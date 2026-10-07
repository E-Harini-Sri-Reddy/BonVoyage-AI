export function buildTripKey(input) {
  const raw = [
    input.origin,
    input.destination,
    input.fromDate,
    input.toDate,
    input.budget,
    input.currency,
    input.travellers,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }

  return `trip-${hash.toString(36)}`;
}

export function buildFavoriteId(type, data) {
  switch (type) {
    case 'trip':
      return `trip-${data.origin}-${data.destination}-${data.fromDate}`;
    case 'flight':
      return `flight-${data.airline}-${data.route}-${data.price}`;
    case 'hotel':
      return `hotel-${data.name}`;
    case 'place':
      return `place-${data.name}`;
    case 'activity':
      return `activity-${data.title}`;
    default:
      return `${type}-${JSON.stringify(data).slice(0, 50)}`;
  }
}

export function buildShareText(input, plan) {
  const lines = [
    `✈️ ${input.origin} → ${input.destination}`,
    `📅 ${input.fromDate} to ${input.toDate}`,
    `👥 ${input.travellers} traveller(s) · 💰 ${input.budget} ${input.currency}`,
  ];

  if (plan?.summary?.text) {
    lines.push('', plan.summary.text);
  }

  if (plan?.itinerary?.length) {
    lines.push('', '📋 Itinerary highlight:');
    plan.itinerary.slice(0, 2).forEach((day) => {
      lines.push(`Day ${day.day}: ${day.morning?.slice(0, 80)}...`);
    });
  }

  lines.push('', 'Planned with BonVoyage AI');
  return lines.join('\n');
}
