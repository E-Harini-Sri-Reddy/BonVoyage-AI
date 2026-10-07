import { WEATHER_PERIODS } from '../config/constants.js';
import { getDateRange, unixToDateString } from '../utils/dateHelpers.js';

function avg(values) {
  const valid = values.filter((v) => v != null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function buildPeriodFromHourly(hourly, periodKey) {
  const { start, end, label } = WEATHER_PERIODS[periodKey];
  const slots = hourly.filter((h) => {
    const hour = new Date(h.dt * 1000).getHours();
    return hour >= start && hour < end;
  });

  if (!slots.length) return null;

  const iconEntry = slots[Math.floor(slots.length / 2)];

  return {
    period: label,
    icon: iconEntry.weather?.[0]?.icon || '01d',
    description: iconEntry.weather?.[0]?.description || '',
    temp: Math.round(avg(slots.map((s) => s.temp))),
    rainProbability: Math.round(avg(slots.map((s) => (s.pop ?? 0) * 100))),
    humidity: Math.round(avg(slots.map((s) => s.humidity))),
    windSpeed: Math.round(avg(slots.map((s) => s.wind_speed)) * 10) / 10,
    aiInsight: null,
  };
}

function buildPeriodFromDaily(daily, periodKey) {
  const { label } = WEATHER_PERIODS[periodKey];
  const tempMap = {
    morning: daily.temp?.morn ?? daily.temp?.day,
    afternoon: daily.temp?.day,
    evening: daily.temp?.eve ?? daily.temp?.day,
  };

  return {
    period: label,
    icon: daily.weather?.[0]?.icon || '01d',
    description: daily.weather?.[0]?.description || '',
    temp: Math.round(tempMap[periodKey] ?? daily.temp?.day ?? 0),
    rainProbability: Math.round((daily.pop ?? 0) * 100),
    humidity: daily.humidity ?? null,
    windSpeed: daily.wind_speed ?? null,
    aiInsight: null,
  };
}

export function normalizeWeatherForTrip(weatherData, fromDate, toDate) {
  const tripDates = getDateRange(fromDate, toDate);
  const hourly = weatherData?.hourly || [];
  const daily = weatherData?.daily || [];

  return tripDates.map((date) => {
    const dayHourly = hourly.filter((h) => unixToDateString(h.dt) === date);
    const dayDaily = daily.find((d) => unixToDateString(d.dt) === date);

    const periods = ['morning', 'afternoon', 'evening'].map((key) => {
      if (dayHourly.length) {
        return buildPeriodFromHourly(dayHourly, key);
      }
      if (dayDaily) {
        return buildPeriodFromDaily(dayDaily, key);
      }
      return null;
    }).filter(Boolean);

    return { date, periods };
  });
}
