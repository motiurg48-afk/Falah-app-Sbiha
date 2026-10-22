'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageLightbox({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const go = (dir: 1 | -1) => {
    setZoomed(false);
    setIndex((i) => (i + dir + count) % count);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (count > 1 && e.key === 'ArrowRight') go(1);
      if (count > 1 && e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 flex flex-col animate-[fadeIn_.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="flex items-center justify-between px-4 py-3 text-[#E8D48B]">
        <span className="text-xs font-semibold tracking-widest">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="p-2 rounded-full border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 transition"
            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          >
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full border border-[#D4AF37]/40 hover:bg-[#D4AF37]/15 transition"
            aria-label="Close viewer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className={`flex-1 relative flex items-center justify-center ${zoomed ? 'overflow-auto' : 'overflow-hidden'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (zoomed || touchStartX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <img
          key={images[index]}
          src={images[index]}
          alt={`${alt} — ${index + 1}`}
          onClick={() => setZoomed((z) => !z)}
          draggable={false}
          className={`select-none transition-transform duration-300 ${
            zoomed
              ? 'max-w-none w-[200%] md:w-[160%] cursor-zoom-out'
              : 'max-w-full max-h-[calc(100vh-140px)] object-contain cursor-zoom-in'
          }`}
        />

        {count > 1 && !zoomed && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 border border-[#D4AF37]/40 text-[#E8D48B] hover:bg-[#D4AF37] hover:text-black transition"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 border border-[#D4AF37]/40 text-[#E8D48B] hover:bg-[#D4AF37] hover:text-black transition"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              onClick={() => {
                setZoomed(false);
                setIndex(i);
              }}
              className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition ${
                i === index ? 'border-[#D4AF37]' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
