'use client';
import React, { useState } from 'react';
import { PackageSearch, X, ExternalLink, Truck } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type TrackedOrder = {
  order_code: string | null;
  product_title: string;
  variant_chosen: string | null;
  total_amount: number;
  shipping_charge: number | null;
  status: string;
  courier_name: string | null;
  awb_number: string | null;
  tracking_url: string | null;
  created_at: string;
};

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, Record<string, string>> = {
  pending: { bn: 'অর্ডার প্লেসড', en: 'Order Placed', hi: 'ऑर्डर प्लेस', ur: 'آرڈر پلیس' },
  confirmed: { bn: 'কনফার্মড', en: 'Confirmed', hi: 'कन्फर्म', ur: 'کنفرم' },
  shipped: { bn: 'শিপড', en: 'Shipped', hi: 'शिप', ur: 'شپ' },
  delivered: { bn: 'ডেলিভারড', en: 'Delivered', hi: 'डिलीवर', ur: 'ڈیلیور' },
  cancelled: { bn: 'বাতিল', en: 'Cancelled', hi: 'रद्द', ur: 'منسوخ' },
};

export default function TrackOrderModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(false);
    try {
      const isPhone = /^[0-9+\-\s]{6,}$/.test(q) && !q.toUpperCase().startsWith('ORD');
      const digits = q.replace(/[^0-9]/g, '');
      let builder = supabase
        .from('orders')
        .select(
          'order_code, product_title, variant_chosen, total_amount, shipping_charge, status, courier_name, awb_number, tracking_url, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(10);
      if (isPhone && digits.length >= 6) {
        builder = builder.ilike('customer->>phone', `%${digits}%`);
      } else {
        builder = builder.eq('order_code', q);
      }
      const { data, error } = await builder;
      if (error) throw error;
      setOrders((data ?? []) as TrackedOrder[]);
    } catch {
      setOrders([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const statusLabel = (s: string) => STATUS_LABELS[s]?.[lang] ?? s;
  const currentStep = (s: string) => STATUS_STEPS.indexOf(s);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <PackageSearch size={17} className="text-emerald-800" /> {t('trackTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-5 pb-3 space-y-2.5">
          <input
            type="text"
            placeholder={t('trackInput')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-2.5 rounded-lg text-sm transition"
          >
            {loading ? t('processing') : t('trackSearch')}
          </button>
        </form>

        <div className="px-5 pb-5 space-y-3">
          {searched && orders.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">{t('trackNotFound')}</p>
          )}

          {orders.map((o, i) => {
            const step = currentStep(o.status);
            const cancelled = o.status === 'cancelled';
            return (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block">#{o.order_code ?? '—'}</span>
                    <span className="text-sm font-bold text-gray-900">{o.product_title}</span>
                    {o.variant_chosen && (
                      <span className="text-[11px] text-gray-500 block">{o.variant_chosen}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      cancelled
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : o.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>

                {!cancelled && (
                  <div className="flex items-center">
                    {STATUS_STEPS.map((s, si) => (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              si <= step ? 'bg-emerald-700 border-emerald-700' : 'bg-white border-gray-300'
                            }`}
                          />
                          <span className="text-[8px] text-gray-500 mt-0.5 font-semibold">
                            {statusLabel(s)}
                          </span>
                        </div>
                        {si < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 -mt-3 ${si < step ? 'bg-emerald-700' : 'bg-gray-300'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('successTotal')}</span>
                    <span className="font-bold text-emerald-900">₹{o.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('trackCourier')}</span>
                    <span className="font-semibold text-gray-800">
                      {o.courier_name || t('trackNone')}
                    </span>
                  </div>
                  {o.awb_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('trackAwb')}</span>
                      <span className="font-semibold text-gray-800">{o.awb_number}</span>
                    </div>
                  )}
                </div>

                {o.tracking_url && (
                  <a
                    href={o.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg text-xs transition"
                  >
                    <Truck size={13} /> {t('trackOpen')} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
