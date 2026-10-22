'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { isSafeLink, type HeroBanner } from '@/lib/catalog';

const INTERVAL_MS = 5500;

export default function HeroSlider({ banners, ctaLabel }: { banners: HeroBanner[]; ctaLabel: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = banners.length;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  return (
    <section
      className="relative w-full h-[260px] sm:h-[360px] md:h-[460px] overflow-hidden bg-[#0d0d0d]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
      aria-roledescription="carousel"
    >
      {banners.map((b, i) => {
        const active = i === index;
        const link = isSafeLink(b.link_url) ? b.link_url : null;
        const external = link ? /^https?:/i.test(link) : false;
        const content = (
          <>
            <img
              src={b.image_url}
              alt={b.title || 'FALAH banner'}
              className="absolute inset-0 w-full h-full object-cover"
              style={active ? { animation: `heroKenBurns ${INTERVAL_MS + 1500}ms ease-out forwards` } : undefined}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {(b.title || b.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            )}
            {(b.title || b.subtitle || link) && (
              <div
                className={`absolute inset-x-0 bottom-0 px-5 sm:px-10 pb-16 sm:pb-20 max-w-3xl transition-all duration-700 ${
                  active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {b.title && (
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight drop-shadow-lg">
                    {b.title}
                  </h2>
                )}
                {b.subtitle && (
                  <p className="mt-2 text-xs sm:text-sm text-[#F3E7BE] leading-relaxed max-w-xl drop-shadow">
                    {b.subtitle}
                  </p>
                )}
                {link && (
                  <span className="mt-4 inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#0d0d0d] text-xs font-bold px-4 py-2 rounded-full shadow-lg group-hover:bg-[#E8C34A] transition">
                    {ctaLabel}
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            )}
          </>
        );
        return (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            aria-hidden={!active}
          >
            {link ? (
              <a
                href={link}
                className="group block w-full h-full"
                tabIndex={active ? 0 : -1}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {content}
              </a>
            ) : (
              content
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute z-20 left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#E8D48B] hover:bg-[#D4AF37] hover:text-black transition"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute z-20 right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#E8D48B] hover:bg-[#D4AF37] hover:text-black transition"
            aria-label="Next banner"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute z-20 bottom-9 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
