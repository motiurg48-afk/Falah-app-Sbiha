'use client';
import React from 'react';
import { X, Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/lib/shop-store';
import { useLang, categoryKey } from '@/lib/i18n';

export default function WishlistModal({
  open,
  onClose,
  onOrder,
}: {
  open: boolean;
  onClose: () => void;
  onOrder: (productId: string) => void;
}) {
  const { t } = useLang();
  const { items, remove } = useWishlist();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-400" fill="currentColor" />
            <h3 className="font-bold">{t('wishTitle')} ({items.length})</h3>
          </div>
          <button onClick={onClose} aria-label="Close wishlist" className="text-emerald-200 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-gray-400 px-6 text-center">
            <Heart size={44} className="text-gray-200 mb-3" />
            <p className="text-sm font-semibold">{t('wishEmpty')}</p>
            <button
              onClick={onClose}
              className="mt-4 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full hover:bg-emerald-100 transition"
            >
              {t('cartContinue')}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-gray-300 font-bold">FALAH</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{item.productTitle}</h4>
                  <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">{t(categoryKey(item.category))}</p>
                  <span className="text-sm font-extrabold text-emerald-900">₹{item.basePrice}</span>
                </div>
                <div className="flex flex-col gap-1.5 justify-center flex-shrink-0">
                  <button
                    onClick={() => {
                      onOrder(item.productId);
                      onClose();
                    }}
                    className="text-[10px] font-bold bg-emerald-900 text-white px-3 py-1.5 rounded-full hover:bg-emerald-800 transition flex items-center gap-1"
                  >
                    <ShoppingBag size={11} /> {t('orderNow')}
                  </button>
                  <button
                    onClick={() => remove(item.productId)}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 py-1 transition"
                  >
                    {t('wishRemove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
