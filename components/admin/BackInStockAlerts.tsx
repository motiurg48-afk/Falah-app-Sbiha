'use client';
import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle, Clock, Phone, Mail, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Alert = {
  id: string;
  product_id: string;
  customer_phone: string | null;
  customer_email: string | null;
  notified: boolean;
  created_at: string;
};

export default function BackInStockAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    supabase
      .from('back_in_stock_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) setAlerts(data as Alert[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch();
  }, []);

  const markNotified = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, notified: true } : a)));
    await supabase.from('back_in_stock_alerts').update({ notified: true }).eq('id', id);
  };

  const unfiltered = alerts.filter((a) =>
    productFilter ? a.product_id.toLowerCase().includes(productFilter.toLowerCase()) : true
  );

  const pending = unfiltered.filter((a) => !a.notified);
  const done = unfiltered.filter((a) => a.notified);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BellRing size={18} /> ব্যাক-ইন-স্টক অ্যালার্ট
        </h2>
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
        </button>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          placeholder="প্রোডাক্ট ID দিয়ে ফিল্টার..."
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <span className="text-2xl font-extrabold text-amber-800">{pending.length}</span>
          <p className="text-[11px] font-bold text-amber-700 mt-0.5">Notified হয়নি</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <span className="text-2xl font-extrabold text-emerald-800">{done.length}</span>
          <p className="text-[11px] font-bold text-emerald-700 mt-0.5">Notified হয়েছে</p>
        </div>
      </div>

      {unfiltered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          এখনো কোনো অ্যালার্ট রিকোয়েস্ট আসেনি।
        </div>
      ) : (
        <div className="space-y-2">
          {unfiltered.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-lg border p-3 flex items-start justify-between gap-3 ${
                a.notified ? 'border-emerald-200' : 'border-amber-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">{a.product_id}</span>
                  {a.notified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} /> Notified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock size={10} /> Pending
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-gray-600">
                  {a.customer_phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {a.customer_phone}
                    </span>
                  )}
                  {a.customer_email && (
                    <span className="flex items-center gap-1">
                      <Mail size={10} /> {a.customer_email}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(a.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              {!a.notified && (
                <button
                  onClick={() => markNotified(a.id)}
                  className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Notified ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}