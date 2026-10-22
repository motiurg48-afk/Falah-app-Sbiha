'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Clock, Loader2, MessageCircle, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type CartLine = { title?: string; variant?: string; size?: string; qty?: number; price?: number; image?: string };

type AbandonedCart = {
  id: string;
  name: string | null;
  phone: string | null;
  items: CartLine[] | null;
  subtotal: number;
  item_count: number;
  status: 'open' | 'reminded' | 'recovered';
  reminded_at: string | null;
  created_at: string;
  updated_at: string;
};

type Filter = 'pending' | 'reminded' | 'recovered' | 'all';

const ABANDON_AFTER_MS = 30 * 60 * 1000;

function waLink(phone: string | null, message: string) {
  let digits = String(phone ?? '').replace(/[^0-9]/g, '').replace(/^0+/, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

function isAbandoned(c: AbandonedCart) {
  return Date.now() - new Date(c.updated_at).getTime() > ABANDON_AFTER_MS;
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  return `${Math.round(hrs / 24)} দিন আগে`;
}

function recoveryMessage(c: AbandonedCart) {
  const lines = (c.items ?? []).map((i) => `- ${i.title ?? ''}${i.size ? ` (${i.size})` : ''} x${i.qty ?? 1}`).join('\n');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `আসসালামু আলাইকুম${c.name ? ` ${c.name}` : ''}!\n\nআপনি FALAH-এ কিছু পণ্য কার্টে রেখে গেছেন:\n${lines}\n\nমোট: ₹${c.subtotal}\n\nস্টক শেষ হওয়ার আগে অর্ডারটি সম্পন্ন করুন: ${origin}\nকোনো প্রশ্ন থাকলে এখানেই জানান।`;
}

export default function AbandonedCarts() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.from('abandoned_carts').select('*').order('updated_at', { ascending: false }).limit(300);
    if (err) {
      setError('কার্টের তালিকা লোড করা যায়নি।');
      setCarts([]);
    } else {
      setCarts((data ?? []) as AbandonedCart[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      pending: carts.filter((c) => c.status === 'open' && isAbandoned(c)).length,
      reminded: carts.filter((c) => c.status === 'reminded').length,
      recovered: carts.filter((c) => c.status === 'recovered').length,
      all: carts.length,
    }),
    [carts]
  );

  const recoverable = carts.filter((c) => c.status !== 'recovered').reduce((s, c) => s + (c.subtotal || 0), 0);

  const shown = carts.filter((c) => {
    if (filter === 'pending') return c.status === 'open' && isAbandoned(c);
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const markReminded = async (c: AbandonedCart) => {
    setBusyId(c.id);
    const reminded_at = new Date().toISOString();
    const { error: err } = await supabase.from('abandoned_carts').update({ status: 'reminded', reminded_at }).eq('id', c.id);
    if (err) setError('স্ট্যাটাস আপডেট করা যায়নি।');
    else setCarts((list) => list.map((x) => (x.id === c.id ? { ...x, status: 'reminded', reminded_at } : x)));
    setBusyId(null);
  };

  const remove = async (c: AbandonedCart) => {
    if (!confirm('এই কার্টটি মুছে ফেলবেন?')) return;
    setBusyId(c.id);
    const { error: err } = await supabase.from('abandoned_carts').delete().eq('id', c.id);
    if (err) setError('মুছে ফেলা যায়নি।');
    else setCarts((list) => list.filter((x) => x.id !== c.id));
    setBusyId(null);
  };

  const tabs: { id: Filter; label: string }[] = [
    { id: 'pending', label: 'রিমাইন্ডার বাকি' },
    { id: 'reminded', label: 'রিমাইন্ড করা হয়েছে' },
    { id: 'recovered', label: 'অর্ডার হয়েছে' },
    { id: 'all', label: 'সব' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'রিমাইন্ডার বাকি', value: counts.pending, icon: <Clock size={16} />, cls: 'text-amber-700 bg-amber-50' },
          { label: 'রিমাইন্ড করা', value: counts.reminded, icon: <BellRing size={16} />, cls: 'text-sky-700 bg-sky-50' },
          { label: 'রিকভার হয়েছে', value: counts.recovered, icon: <CheckCircle2 size={16} />, cls: 'text-emerald-700 bg-emerald-50' },
          { label: 'সম্ভাব্য বিক্রি', value: `₹${recoverable.toLocaleString('en-IN')}`, icon: <ShoppingCart size={16} />, cls: 'text-[#8a6d1a] bg-[#FFF8E1]' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.cls}`}>{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                filter === t.id ? 'bg-[#0d0d0d] text-[#E8C34A] border-[#0d0d0d]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.label} ({counts[t.id]})
            </button>
          ))}
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        ক্রেতা কার্টে পণ্য রেখে ৩০ মিনিটের বেশি অর্ডার না করলে এখানে দেখাবে। ফোন নম্বর থাকলে এক ক্লিকে WhatsApp রিমাইন্ডার পাঠান। ক্রেতারা ওয়েবসাইটে ফিরলে নিজে থেকেই রিমাইন্ডার দেখতে পান।
      </p>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-12 text-center text-sm text-gray-400">এই তালিকায় কোনো কার্ট নেই।</div>
      ) : (
        <div className="grid gap-3">
          {shown.map((c) => {
            const link = waLink(c.phone, recoveryMessage(c));
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900">{c.name || 'অজানা ক্রেতা'}</div>
                    <div className="text-xs text-gray-500">{c.phone || 'ফোন নম্বর নেই'}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      শেষ সক্রিয়: {timeAgo(c.updated_at)}
                      {c.reminded_at && ` • রিমাইন্ডার: ${timeAgo(c.reminded_at)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">₹{c.subtotal}</div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'recovered' ? 'bg-emerald-100 text-emerald-800' : c.status === 'reminded' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status === 'recovered' ? 'অর্ডার হয়েছে' : c.status === 'reminded' ? 'রিমাইন্ড করা' : 'খোলা'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {(c.items ?? []).map((i, k) => (
                    <div key={k} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-1.5 pr-3 flex-shrink-0">
                      {i.image && <img src={i.image} alt="" className="w-9 h-9 rounded object-cover" />}
                      <div className="text-[11px] leading-tight">
                        <div className="font-semibold text-gray-800 max-w-[160px] truncate">{i.title}</div>
                        <div className="text-gray-500">
                          {[i.variant, i.size].filter(Boolean).join(' / ')} x{i.qty ?? 1} • ₹{i.price ?? 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {c.status !== 'recovered' && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => c.status === 'open' && markReminded(c)}
                        className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                      >
                        <MessageCircle size={14} /> WhatsApp রিমাইন্ডার
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-400 self-center">ক্রেতা ফোন নম্বর দেননি, শুধু ওয়েবসাইটে রিমাইন্ডার দেখবেন।</span>
                    )}
                    {c.status === 'open' && (
                      <button
                        onClick={() => markReminded(c)}
                        disabled={busyId === c.id}
                        className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        <BellRing size={14} /> রিমাইন্ড করা হয়েছে
                      </button>
                    )}
                    <button
                      onClick={() => remove(c)}
                      disabled={busyId === c.id}
                      className="inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 size={14} /> মুছুন
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
