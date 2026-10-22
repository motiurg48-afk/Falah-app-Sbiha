'use client';
import React, { useState } from 'react';
import { CheckCircle, Loader2, Pencil, Plus, X } from 'lucide-react';
import { createStoreProduct, updateStoreProduct, type StoreProduct } from '@/lib/catalog';
import { parseOptionsText, serializeOptions, type CustomOptionGroup } from '@/lib/variant-engine';
import ProductImageField from './ProductImageField';

type Props = {
  product: StoreProduct | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
};

const field =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition';

function initialImages(p: StoreProduct | null): string[] {
  if (!p) return [];
  const list = [p.image, ...(p.images ?? [])].filter((x): x is string => typeof x === 'string' && x.length > 0);
  return Array.from(new Set(list));
}

export default function ProductFormModal({ product, categories, onClose, onSaved }: Props) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    title: product?.title ?? '',
    category: product?.category || categories[0] || 'Abaya',
    basePrice: product ? String(product.basePrice) : '',
    regularPrice: product?.regularPrice ? String(product.regularPrice) : '',
    stock: product?.stock != null ? String(product.stock) : '',
    fabric: product?.fabric ?? '',
    description: product?.description ?? '',
    images: initialImages(product),
    optionsText: serializeOptions(product?.customOptions as CustomOptionGroup[] | undefined),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categoryOptions = Array.from(new Set([...categories, form.category].filter(Boolean)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const basePrice = Number(form.basePrice);
    const regularPrice = form.regularPrice.trim() === '' ? null : Number(form.regularPrice);
    const stock = form.stock.trim() === '' ? null : Number(form.stock);
    if (!form.title.trim() || !Number.isFinite(basePrice) || basePrice < 0 || form.basePrice === '') {
      setError('Title এবং সঠিক Price আবশ্যক।');
      return;
    }
    if (regularPrice !== null && (!Number.isFinite(regularPrice) || regularPrice < 0)) {
      setError('Regular Price সঠিক নয়।');
      return;
    }
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setError('স্টক অবশ্যই ০ বা তার বেশি পূর্ণসংখ্যা হতে হবে।');
      return;
    }
    const customOptions = parseOptionsText(form.optionsText);
    const extra: Record<string, unknown> = {
      image: form.images[0] ?? null,
      images: form.images.length > 0 ? form.images : null,
      customOptions: customOptions.length > 0 ? customOptions : null,
    };
    const input = {
      title: form.title.trim(),
      category: form.category,
      basePrice,
      regularPrice,
      stock,
      fabric: form.fabric.trim() || null,
      description: form.description.trim() || null,
      extra,
    };
    setSaving(true);
    setError('');
    try {
      if (product) await updateStoreProduct(product, input);
      else await createStoreProduct(input);
      onSaved();
    } catch {
      setError('সেভ করা যায়নি। আপনি অ্যাডমিন হিসেবে লগইন আছেন কিনা দেখুন এবং আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            {isEdit ? <Pencil size={17} className="text-[#B8962E]" /> : <Plus size={18} className="text-[#B8962E]" />}
            {isEdit ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <ProductImageField images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} placeholder="e.g. SM 102 - Premium Abaya Set" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${field} bg-white`}>
                {categoryOptions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Fabric</label>
              <input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} className={field} placeholder="e.g. Almas" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Price (₹) *</label>
              <input type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className={field} placeholder="1200" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">MRP (₹)</label>
              <input type="number" min={0} value={form.regularPrice} onChange={(e) => setForm({ ...form, regularPrice: e.target.value })} className={field} placeholder="1500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">স্টক</label>
              <input type="number" min={0} step={1} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={field} placeholder="সীমাহীন" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 -mt-1">স্টক খালি রাখলে ট্র্যাক করা হবে না। ০ হলে স্টোরে Out of Stock দেখাবে, ৫ এর নিচে হলে লো-স্টক অ্যালার্ট।</p>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${field} resize-none`} placeholder="ছোট বিবরণ" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Custom Options (one group per line)</label>
            <p className="text-[10px] text-gray-400 mb-1 leading-relaxed">
              ফরম্যাট: GroupName: Option A, Option B +500, Option C -200। যেমন — Color: Black, Blue +200
            </p>
            <textarea
              value={form.optionsText}
              onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
              rows={3}
              className={`${field} resize-none font-mono text-xs`}
              placeholder={'Color: Black, Blue +200\nWarranty: 6 months, 1 year +500'}
            />
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/50 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {isEdit ? 'সেভ করুন' : 'পাবলিশ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
