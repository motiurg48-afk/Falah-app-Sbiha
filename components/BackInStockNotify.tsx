'use client';
import React, { useState } from 'react';
import { Bell, BellRing, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function BackInStockNotify({ productId }: { productId: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!email && cleanPhone.length < 10) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('back_in_stock_alerts').insert({
        product_id: productId,
        customer_phone: cleanPhone.length >= 10 ? cleanPhone : null,
        customer_email: email || null,
      });
      if (error) throw error;
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-[11px] md:text-sm flex items-center justify-center gap-1.5 transition shadow-sm"
      >
        <Bell size={13} /> Notify Me When Available
      </button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="w-full">
      {done ? (
        <div className="flex items-center justify-center gap-1.5 bg-green-100 border border-green-200 text-green-800 text-[11px] md:text-sm font-bold py-2 rounded-lg">
          <CheckCircle size={13} />
          We'll notify you when it's back!
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-2">
          <p className="text-[10px] md:text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <BellRing size={12} />
            Get notified when this item is back in stock
          </p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full border border-amber-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-600 bg-white"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="w-full border border-amber-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-600 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-bold py-1.5 rounded-md transition flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
              Notify Me
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 bg-white border border-amber-300 text-amber-800 text-xs font-bold py-1.5 rounded-md hover:bg-amber-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}