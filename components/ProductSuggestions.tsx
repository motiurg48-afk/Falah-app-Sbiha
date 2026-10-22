'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, ImageOff, Sparkles } from 'lucide-react';

type MiniProduct = {
  id: string;
  title: string;
  category?: string;
  basePrice?: number;
  image?: string;
  images?: string[];
  isOutOfStock?: boolean;
};

const RECENT_KEY = 'falah_recently_viewed';
const RECENT_MAX = 12;

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed(currentId: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const prev = readRecent();
    setIds(prev.filter((id) => id !== currentId));
    const next = [currentId, ...prev.filter((id) => id !== currentId)].slice(0, RECENT_MAX);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // storage full or blocked; recently viewed is optional
    }
  }, [currentId]);
  return ids;
}

function MiniCard({ p, onSelect }: { p: MiniProduct; onSelect: (p: MiniProduct) => void }) {
  const img = p.image || p.images?.[0];
  return (
    <button
      onClick={() => onSelect(p)}
      className="group flex-shrink-0 w-32 sm:w-36 text-left snap-start"
    >
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-[#D4AF37]/60 transition">
        {img ? (
          <img
            src={img}
            alt={p.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageOff size={22} />
          </div>
        )}
        {p.isOutOfStock && (
          <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            Sold out
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-emerald-900">
        {p.title}
      </p>
      {typeof p.basePrice === 'number' && (
        <p className="text-xs font-bold text-emerald-900 mt-0.5">₹{p.basePrice}</p>
      )}
    </button>
  );
}

function Rail({
  title,
  icon,
  items,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  items: MiniProduct[];
  onSelect: (p: MiniProduct) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  return (
    <div className="pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          {icon}
          {title}
        </h4>
        {items.length > 3 && (
          <div className="flex gap-1">
            <button
              onClick={() => scroll(-1)}
              className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#D4AF37] hover:text-[#8a6d12] transition"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#D4AF37] hover:text-[#8a6d12] transition"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((p) => (
          <MiniCard key={p.id} p={p} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export default function ProductSuggestions<T extends MiniProduct>({
  product,
  allProducts,
  onSelect,
  relatedTitle,
  recentTitle,
}: {
  product: T;
  allProducts: T[];
  onSelect: (p: T) => void;
  relatedTitle: string;
  recentTitle: string;
}) {
  const recentIds = useRecentlyViewed(product.id);
  const byId = new Map(allProducts.map((p) => [p.id, p]));

  const sameCategory = allProducts.filter((p) => p.id !== product.id && p.category === product.category);
  const others = allProducts.filter((p) => p.id !== product.id && p.category !== product.category);
  const related = [...sameCategory, ...others.slice(0, Math.max(0, 6 - sameCategory.length))].slice(0, 10);

  const recent = recentIds.map((id) => byId.get(id)).filter((p): p is T => Boolean(p));

  return (
    <div className="space-y-4">
      <Rail
        title={relatedTitle}
        icon={<Sparkles size={14} className="text-[#B8962E]" />}
        items={related}
        onSelect={(p) => onSelect(p as T)}
      />
      <Rail
        title={recentTitle}
        icon={<Clock size={14} className="text-[#B8962E]" />}
        items={recent}
        onSelect={(p) => onSelect(p as T)}
      />
    </div>
  );
}
