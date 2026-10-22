'use client';
import React from 'react';
import { Gift, Percent } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import { bundlesForCategory, flashAppliesTo, isFlashLive, type BundleOffer, type FlashSale } from '@/lib/offers';

export default function ProductOffers({
  productId,
  category,
  flash,
  bundles,
}: {
  productId: string;
  category: string;
  flash: FlashSale | null;
  bundles: BundleOffer[];
}) {
  const { t } = useLang();
  const deals = bundlesForCategory(bundles, category);
  const showFlash = isFlashLive(flash) && flashAppliesTo(flash, productId);
  if (!showFlash && deals.length === 0) return null;

  return (
    <div className="space-y-2">
      {showFlash && <FlashSaleBanner sale={flash} compact />}
      {deals.length > 0 && (
        <div className="rounded-lg border border-dashed border-[#D4AF37] bg-[#FFFBEB] p-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-900 block mb-1.5">{t('comboOffers')}</span>
          <ul className="space-y-1.5">
            {deals.map((d) => (
              <li key={d.id} className="flex items-start gap-2 text-xs text-amber-950">
                <span className="w-5 h-5 rounded-full bg-[#0d0d0d] text-[#E8C34A] flex items-center justify-center flex-shrink-0">
                  {d.kind === 'free_gift' ? <Gift size={11} /> : <Percent size={11} />}
                </span>
                <span>
                  <span className="font-bold">{d.title}</span>
                  <span className="text-amber-800/80 block text-[11px]">
                    {d.kind === 'free_gift'
                      ? t('comboGiftRule').replace('{n}', String(d.minQty)).replace('{gift}', d.giftText)
                      : t('comboPctRule').replace('{n}', String(d.minQty)).replace('{p}', String(d.percent))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
