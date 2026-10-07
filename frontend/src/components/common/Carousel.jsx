import { useRef, useState, useEffect } from 'react';

export default function Carousel({ children, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  const scroll = (dir) => {
    const amount = Math.min(scrollRef.current?.clientWidth || 320, 320);
    scrollRef.current?.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 dark:bg-slate-800/90 p-2 shadow-md hover:shadow-lg transition-shadow hidden sm:block"
          aria-label="Scroll left"
        >
          ←
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 dark:bg-slate-800/90 p-2 shadow-md hover:shadow-lg transition-shadow hidden sm:block"
          aria-label="Scroll right"
        >
          →
        </button>
      )}
    </div>
  );
}
