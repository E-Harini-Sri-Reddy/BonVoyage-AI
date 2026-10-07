import Carousel from '../common/Carousel';
import HotelCard from './HotelCard';
import { useFavorites } from '../../hooks/useFavorites';

export default function HotelsSection({ hotels, currency }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!hotels?.length) return null;

  return (
    <Carousel>
      {hotels.map((hotel, i) => (
        <HotelCard
          key={`${hotel.name}-${i}`}
          hotel={hotel}
          currency={currency}
          isFavorited={isFavorite('hotel', hotel)}
          onFavorite={() => toggleFavorite('hotel', hotel, { title: hotel.name, subtitle: hotel.address })}
        />
      ))}
    </Carousel>
  );
}
