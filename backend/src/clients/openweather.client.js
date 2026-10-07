import axios from 'axios';
import { env } from '../config/env.js';

const client3 = axios.create({
  baseURL: 'https://api.openweathermap.org/data/3.0',
  timeout: 15000,
});

const client25 = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 15000,
});

export async function getOneCallWeather(lat, lon) {
  const { data } = await client3.get('/onecall', {
    params: {
      lat,
      lon,
      exclude: 'minutely,alerts',
      units: 'metric',
      appid: env.openweatherApiKey,
    },
  });
  return data;
}

/** Free-tier fallback: 5-day / 3-hour forecast */
export async function getForecast25(lat, lon) {
  const { data } = await client25.get('/forecast', {
    params: {
      lat,
      lon,
      units: 'metric',
      appid: env.openweatherApiKey,
    },
  });
  return data;
}

export function forecast25ToHourly(forecastData) {
  return (forecastData?.list || []).map((item) => ({
    dt: item.dt,
    temp: item.main?.temp,
    humidity: item.main?.humidity,
    pop: item.pop ?? 0,
    wind_speed: item.wind?.speed,
    weather: item.weather,
  }));
}

export async function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
