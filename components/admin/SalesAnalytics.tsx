'use client';
import React, { useMemo } from 'react';
import { Clock, IndianRupee, Package, ShoppingCart, TrendingUp, Trophy } from 'lucide-react';
import type { DbOrder } from '@/lib/supabase';

type Props = {
  orders: DbOrder[];
  productCount: number;
  lowStockCount: number;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function SalesAnalytics({ orders, productCount, lowStockCount }: Props) {
  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'cancelled');
    const today = valid.filter((o) => o.created_at && isToday(o.created_at));
    const todayRevenue = today.reduce((s, o) => s + (o.total_amount ?? 0), 0);
    const totalRevenue = valid.reduce((s, o) => s + (o.total_amount ?? 0), 0);
    const pending = orders.filter((o) => o.status === 'pending').length;

    const tally = new Map<string, { qty: number; revenue: number }>();
    valid.forEach((o) => {
      const items = o.order_items && o.order_items.length > 0 ? o.order_items : [{ title: o.product_title, qty: 1, price: o.total_amount ?? 0 }];
      items.forEach((it) => {
        const key = (it.title || 'Unknown').trim();
        const qty = Number(it.qty) || 1;
        const cur = tally.get(key) ?? { qty: 0, revenue: 0 };
        cur.qty += qty;
        cur.revenue += (Number(it.price) || 0) * (o.order_items && o.order_items.length > 0 ? qty : 1);
        tally.set(key, cur);
      });
    });
    const top = Array.from(tally.entries())
      .map(([title, v]) => ({ title, ...v }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 5);

    return { todayRevenue, todayCount: today.length, totalRevenue, totalOrders: orders.length, pending, top };
  }, [orders]);

  const maxQty = stats.top[0]?.qty ?? 1;

  const cards = [
    { icon: <IndianRupee size={16} />, label: 'আজকের আয়', value: inr(stats.todayRevenue), sub: `আজ ${stats.todayCount} টি অর্ডার`, accent: true },
    { icon: <ShoppingCart size={16} />, label: 'মোট অর্ডার', value: stats.totalOrders.toLocaleString('en-IN'), sub: `মোট আয় ${inr(stats.totalRevenue)}` },
    { icon: <Clock size={16} />, label: 'পেন্ডিং', value: String(stats.pending), sub: 'কনফার্ম করা বাকি' },
    { icon: <Package size={16} />, label: 'প্রোডাক্ট', value: String(productCount), sub: lowStockCount > 0 ? `${lowStockCount} টি লো স্টক` : 'স্টক ঠিক আছে', warn: lowStockCount > 0 },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-4 mb-6">
      <div className="lg:col-span-2 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl p-4 border transition hover:-translate-y-0.5 hover:shadow-md ${
              c.accent ? 'bg-[#0d0d0d] border-[#D4AF37]/40 text-white' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide ${c.accent ? 'text-[#E8C34A]' : 'text-gray-500'}`}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.accent ? 'bg-[#D4AF37]/15' : 'bg-gray-100 text-gray-700'}`}>{c.icon}</span>
              {c.label}
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-2 ${c.accent ? 'text-white' : 'text-gray-900'}`}>{c.value}</div>
            <div className={`text-[11px] mt-1 font-medium ${c.warn ? 'text-red-600' : c.accent ? 'text-gray-400' : 'text-gray-500'}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Trophy size={15} />
          </span>
          <h3 className="text-sm font-bold text-gray-900">সবচেয়ে বেশি বিক্রি</h3>
        </div>
        {stats.top.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">এখনো কোনো বিক্রির তথ্য নেই।</p>
        ) : (
          <ol className="space-y-2.5">
            {stats.top.map((p, i) => (
              <li key={p.title}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-[#D4AF37] text-black' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <span className="font-semibold text-gray-800 truncate">{p.title}</span>
                  </span>
                  <span className="text-gray-500 font-bold flex-shrink-0 flex items-center gap-1">
                    <TrendingUp size={11} className="text-emerald-600" /> {p.qty}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#B8962E] to-[#E8C34A] transition-all duration-700" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
