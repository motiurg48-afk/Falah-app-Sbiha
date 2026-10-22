'use client';
import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/shop-store';
import { useLang } from '@/lib/i18n';

export default function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const { t } = useLang();
  const { items, updateQty, remove, subtotal, clear } = useCart();
  const [clearing, setClearing] = useState(false);

  const handleClear = () => {
    setClearing(true);
    setTimeout(() => {
      clear();
      setClearing(false);
    }, 150);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <h3 className="font-bold">{t('cartTitle')} ({items.reduce((n, i) => n + i.qty, 0)})</h3>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="text-emerald-200 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6 text-center">
            <ShoppingBag size={48} className="text-gray-200 mb-3" />
            <p className="text-sm font-semibold">{t('cartEmpty')}</p>
            <button
              onClick={onClose}
              className="mt-4 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full hover:bg-emerald-100 transition"
            >
              {t('cartContinue')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantName}-${item.size}`} className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-gray-300 font-bold">FALAH</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{item.productTitle}</h4>
                      <button
                        onClick={() => remove(item.productId, item.variantName, item.size)}
                        className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
                        aria-label={t('cartRemove')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      {item.variantName}
                      {item.size ? ` • ${t('sizeLabel')} ${item.size}` : ''}
                    </p>
                    {item.note && (
                      <p className="text-[10px] text-gray-500 mt-0.5 italic line-clamp-2">📝 {item.note}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-1 py-0.5">
                        <button
                          onClick={() => updateQty(item.productId, item.variantName, item.size, item.qty - 1)}
                          className="p-1 text-gray-600 hover:text-emerald-800"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.productId, item.variantName, item.size, item.qty + 1)}
                          className="p-1 text-gray-600 hover:text-emerald-800"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-900">₹{item.basePrice * item.qty}</span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleClear}
                disabled={clearing}
                className="w-full text-[11px] font-bold text-red-500 hover:text-red-700 py-1 transition disabled:opacity-50"
              >
                {t('cartClear')}
              </button>
            </div>

            <div className="border-t border-gray-100 p-4 space-y-3 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('cartSubtotal')}</span>
                <span className="text-xl font-extrabold text-emerald-900">₹{subtotal}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">{t('cartShipNote')}</p>
              <button
                onClick={onCheckout}
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md"
              >
                {t('cartCheckout')} <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
