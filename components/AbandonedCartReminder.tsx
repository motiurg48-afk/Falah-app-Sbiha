'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { getCartTouchedAt } from '@/lib/abandoned-cart';
import type { CartItem } from '@/lib/shop-store';

const REMIND_AFTER_MS = 10 * 60 * 1000;
const DISMISS_KEY = 'falah_cart_reminder_dismissed';

export default function AbandonedCartReminder({
  items,
  suppressed,
  onOpenCart,
}: {
  items: CartItem[];
  suppressed: boolean;
  onOpenCart: () => void;
}) {
  const { t } = useLang();
  const [due, setDue] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const hasItems = items.length > 0;
  useEffect(() => {
    setDue(false);
    if (!hasItems) return;
    const touched = getCartTouchedAt() ?? Date.now();
    const wait = Math.max(2500, touched + REMIND_AFTER_MS - Date.now());
    const id = setTimeout(() => setDue(true), wait);
    return () => clearTimeout(id);
  }, [hasItems, items]);

  if (!due || dismissed || suppressed || !hasItems) return null;

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.basePrice * i.qty, 0);
  const thumbs = items.slice(0, 3);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:right-auto sm:max-w-sm z-40 animate-in slide-in-from-bottom-6 fade-in duration-500">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/40 p-4">
        <button onClick={dismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition" aria-label="Close">
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 pr-6">
          <div className="flex -space-x-3">
            {thumbs.map((i) =>
              i.image ? (
                <img key={`${i.productId}-${i.variantName}-${i.size}`} src={i.image} alt={i.productTitle} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow" />
              ) : (
                <span key={`${i.productId}-${i.variantName}-${i.size}`} className="w-11 h-11 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                  <ShoppingBag size={16} className="text-emerald-800" />
                </span>
              )
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">{t('cartReminderTitle')}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('cartReminderSub').replace('{n}', String(count))} • <span className="font-bold text-emerald-900">₹{subtotal}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            dismiss();
            onOpenCart();
          }}
          className="mt-3 w-full bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition group"
        >
          {t('cartReminderCta')} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
