import { formatDate } from '../../utils/formatters';
import Card from '../common/Card';

function WeatherPeriod({ period }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{period.period}</p>
      <img
        src={`https://openweathermap.org/img/wn/${period.icon}@2x.png`}
        alt={period.description || period.period}
        className="h-10 w-10"
        loading="lazy"
      />
      <p className="text-lg font-bold text-slate-900 dark:text-white">{period.temp}°C</p>
      <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        <p>💧 {period.rainProbability}% rain</p>
        <p>💨 {period.windSpeed} m/s</p>
        <p>💦 {period.humidity}% humidity</p>
      </div>
      {period.aiInsight && (
        <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">{period.aiInsight}</p>
      )}
    </div>
  );
}

export default function WeatherSection({ weather }) {
  if (!weather?.length) return null;

  return (
    <div className="space-y-6">
      {weather.map((day) => (
        <div key={day.date}>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{formatDate(day.date)}</h3>
          <div className="grid grid-cols-3 gap-3">
            {day.periods?.map((period) => (
              <WeatherPeriod key={`${day.date}-${period.period}`} period={period} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
