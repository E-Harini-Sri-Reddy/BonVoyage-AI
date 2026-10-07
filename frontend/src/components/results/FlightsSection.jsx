import Carousel from '../common/Carousel';
import FlightCard from './FlightCard';
import { useFavorites } from '../../hooks/useFavorites';

export default function FlightsSection({ flights, currency }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!flights?.length) return null;

  return (
    <Carousel>
      {flights.map((flight, i) => (
        <FlightCard
          key={`${flight.airline}-${flight.price}-${i}`}
          flight={flight}
          currency={currency}
          isFavorited={isFavorite('flight', flight)}
          onFavorite={() => toggleFavorite('flight', flight, { title: `${flight.airline} — ${flight.route}`, subtitle: `${flight.price} ${currency}` })}
        />
      ))}
    </Carousel>
  );
}
