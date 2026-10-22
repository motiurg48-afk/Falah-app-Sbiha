'use client';
import React from 'react';
import { Flame } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const URGENCY_LIMIT = 10;

export default function StockUrgency({ stock, outOfStock }: { stock: number | null | undefined; outOfStock?: boolean }) {
  const { t } = useLang();
  if (outOfStock || stock === null || stock === undefined || stock <= 0 || stock > URGENCY_LIMIT) return null;

  const pct = Math.max(8, Math.round((stock / URGENCY_LIMIT) * 100));
  const critical = stock <= 3;

  return (
    <div className={`rounded-lg border p-3 ${critical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <p className={`text-xs font-bold flex items-center gap-1.5 ${critical ? 'text-red-800' : 'text-amber-900'}`}>
        <Flame size={14} className={critical ? 'text-red-600 animate-pulse' : 'text-amber-600'} fill="currentColor" />
        {t('stockHurry').replace('{n}', String(stock))}
      </p>
      <div className="mt-2 h-2 rounded-full bg-white/80 overflow-hidden border border-black/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${critical ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-amber-500 to-amber-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
