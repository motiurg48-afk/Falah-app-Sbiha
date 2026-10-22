'use client';
import React from 'react';
import { Zap, Timer } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useCountdown, type FlashSale } from '@/lib/offers';

function Unit({ value, label, compact }: { value: number; label: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${compact ? 'min-w-[34px]' : 'min-w-[52px]'}`}>
      <span
        key={value}
        className={`font-mono font-bold tabular-nums rounded-lg bg-[#0d0d0d] text-[#E8C34A] border border-[#D4AF37]/40 animate-in fade-in zoom-in-95 duration-300 ${
          compact ? 'text-sm px-1.5 py-1' : 'text-xl md:text-2xl px-2.5 py-1.5'
        }`}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className={`uppercase tracking-wider opacity-75 mt-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{label}</span>
    </div>
  );
}

export default function FlashSaleBanner({ sale, compact = false }: { sale: FlashSale; compact?: boolean }) {
  const { t } = useLang();
  const c = useCountdown(sale.endsAt);
  if (c.done) return null;

  const units = (
    <div className="flex items-start gap-1.5">
      {c.days > 0 && <Unit value={c.days} label={t('cdDays')} compact={compact} />}
      <Unit value={c.hours} label={t('cdHours')} compact={compact} />
      <Unit value={c.minutes} label={t('cdMins')} compact={compact} />
      <Unit value={c.seconds} label={t('cdSecs')} compact={compact} />
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 p-3 flex items-center justify-between gap-3 text-rose-900">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide">
            <Zap size={13} className="text-rose-600" fill="currentColor" />
            {sale.title || t('flashSale')}
            {sale.percent > 0 && <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[10px]">-{sale.percent}%</span>}
          </span>
          <span className="text-[11px] text-rose-800/80 flex items-center gap-1 mt-0.5">
            <Timer size={11} /> {t('flashEndsIn')}
          </span>
        </div>
        {units}
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mt-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-12 w-40 h-40 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 p-5 md:p-6">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              <Zap size={12} fill="currentColor" className="text-amber-200 animate-pulse" /> {t('flashSale')}
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold mt-2 leading-tight">
              {sale.title || t('flashSale')}
              {sale.percent > 0 && <span className="ml-2 text-amber-200">-{sale.percent}%</span>}
            </h3>
            {sale.subtitle && <p className="text-sm text-white/85 mt-1 leading-relaxed">{sale.subtitle}</p>}
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1">
              <Timer size={12} /> {t('flashEndsIn')}
            </span>
            <div className="text-white">{units}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
