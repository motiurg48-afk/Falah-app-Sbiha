'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { deleteStoreProduct, fetchStoreProducts, subscribeToTable, updateStoreProduct, type StoreProduct } from '@/lib/catalog';
import { addBestSeller, fetchBestSellers, removeBestSeller } from '@/lib/supabase';
import ProductFormModal from './ProductFormModal';

export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(p: Pick<StoreProduct, 'stock'>) {
  return p.stock !== null && p.stock < LOW_STOCK_THRESHOLD;
}

type Props = {
  products: StoreProduct[];
  loading: boolean;
  loadError: boolean;
  categories: string[];
  onReload: () => void;
};

type Filter = 'all' | 'low' | 'out' | 'hidden';

export function useAdminProducts(enabled: boolean) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reload = useMemo(
    () => () => {
      fetchStoreProducts(true)
        .then((rows) => {
          setProducts(rows);
          setLoadError(false);
        })
        .catch(() => setLoadError(true))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;
    reload();
    return subscribeToTable('products', reload);
  }, [enabled, reload]);

  return { products, loading, loadError, reload };
}

export default function ProductManager({ products, loading, loadError, categories, onReload }: Props) {
  const [editing, setEditing] = useState<StoreProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchBestSellers().then(setBestSellerIds).catch(() => setBestSellerIds([]));
  }, []);

  const lowStock = products.filter(isLowStock);
  const outCount = products.filter((p) => p.isOutOfStock).length;
  const hiddenCount = products.filter((p) => !p.isActive).length;

  const visible = products.filter((p) => {
    if (filter === 'low' && !isLowStock(p)) return false;
    if (filter === 'out' && !p.isOutOfStock) return false;
    if (filter === 'hidden' && p.isActive) return false;
    const q = query.trim().toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setActionError('');
    try {
      await fn();
      onReload();
    } catch {
      setActionError('পরিবর্তন সেভ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setBusyId(null);
    }
  };

  const toggleOos = (p: StoreProduct) =>
    run(p.dbId, () =>
      updateStoreProduct(p, {
        extra: { isOutOfStock: !p.isOutOfStock },
        ...(p.isOutOfStock && p.stock === 0 ? { stock: null } : {}),
      })
    );

  const toggleActive = (p: StoreProduct) => run(p.dbId, () => updateStoreProduct(p, { isActive: !p.isActive }));

  const remove = (p: StoreProduct) => {
    if (!confirm(`"${p.title}" স্থায়ীভাবে মুছে ফেলতে চান? এটি স্টোর থেকেও সরে যাবে।`)) return;
    run(p.dbId, () => deleteStoreProduct(p.dbId));
  };

  const toggleBestSeller = async (p: StoreProduct) => {
    const isOn = bestSellerIds.includes(p.id);
    setBestSellerIds((prev) => (isOn ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
    try {
      if (isOn) await removeBestSeller(p.id);
      else await addBestSeller(p.id);
    } catch {
      setBestSellerIds((prev) => (isOn ? [...prev, p.id] : prev.filter((id) => id !== p.id)));
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'সব', count: products.length },
    { key: 'low', label: 'লো স্টক', count: lowStock.length },
    { key: 'out', label: 'Out of Stock', count: outCount },
    { key: 'hidden', label: 'লুকানো', count: hiddenCount },
  ];

  return (
    <section>
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900">প্রোডাক্ট তালিকা ({products.length})</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#E8C34A] bg-[#0d0d0d] border border-[#D4AF37]/50 px-3.5 py-2 rounded-full hover:bg-[#1f1f1f] transition"
        >
          <Plus size={13} /> নতুন প্রোডাক্ট
        </button>
      </div>

      {lowStock.length > 0 && (
        <button
          onClick={() => setFilter('low')}
          className="w-full mb-4 flex items-start gap-3 text-left bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100/70 transition"
        >
          <span className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={17} />
          </span>
          <span>
            <span className="block text-sm font-bold text-red-800">{lowStock.length} টি প্রোডাক্টের স্টক ৫ এর নিচে</span>
            <span className="block text-xs text-red-700/80 mt-0.5 line-clamp-1">
              {lowStock.map((p) => `${p.title} (${p.stock})`).join(' • ')}
            </span>
          </span>
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম বা ক্যাটাগরি দিয়ে খুঁজুন"
            className="w-full border border-gray-200 rounded-full pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#B8962E]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap text-xs font-bold px-3 py-2 rounded-full border transition ${
                filter === f.key ? 'bg-[#0d0d0d] text-[#E8C34A] border-[#0d0d0d]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {actionError && <p className="mb-3 text-xs font-medium text-red-600">{actionError}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে...
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-xl border border-red-200 p-10 text-center text-sm text-red-600">
          প্রোডাক্ট লোড করা যায়নি।{' '}
          <button onClick={onReload} className="underline font-bold">আবার চেষ্টা করুন</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি।</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const low = isLowStock(p);
            const busy = busyId === p.dbId;
            return (
              <div
                key={p.dbId}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition hover:shadow-md ${
                  low ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'
                } ${!p.isActive ? 'opacity-70' : ''}`}
              >
                <div className="relative h-40 bg-gray-100">
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-amber-50 to-gray-100">
                      <ImagePlus size={28} />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {!p.isActive && <span className="bg-gray-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">লুকানো</span>}
                    {low && (
                      <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={11} /> Low Stock: {p.stock}
                      </span>
                    )}
                  </div>
                  {p.isOutOfStock && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Out of Stock</span>
                  )}
                  {busy && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-gray-700" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full uppercase">{p.category || '-'}</span>
                    <span className={`text-[11px] font-bold ${low || p.stock === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      স্টক: {p.stock === null ? '∞' : p.stock}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{p.title}</h3>
                  {p.fabric && <p className="text-[11px] text-[#8a6d1d] font-semibold mt-1">Fabric: {p.fabric}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-lg font-extrabold text-gray-900">₹{p.basePrice}</span>
                    <button
                      onClick={() => toggleBestSeller(p)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border transition flex items-center gap-1 ${
                        bestSellerIds.includes(p.id)
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-amber-500 hover:text-amber-700'
                      }`}
                    >
                      <Award size={11} /> Best Seller
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleOos(p)}
                      disabled={busy}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition ${
                        p.isOutOfStock ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-600'
                      }`}
                    >
                      {p.isOutOfStock ? 'In Stock করুন' : 'Out of Stock'}
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={busy}
                      className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:border-gray-500 transition flex items-center justify-center gap-1"
                    >
                      {p.isActive ? <EyeOff size={11} /> : <Eye size={11} />} {p.isActive ? 'লুকান' : 'দেখান'}
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setEditing(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 rounded-lg py-2 hover:bg-amber-100 transition"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => remove(p)}
                      disabled={busy}
                      aria-label="Delete product"
                      className="px-3 flex items-center justify-center text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(editing || adding) && (
        <ProductFormModal
          product={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSaved={() => {
            setEditing(null);
            setAdding(false);
            onReload();
          }}
        />
      )}
    </section>
  );
}
