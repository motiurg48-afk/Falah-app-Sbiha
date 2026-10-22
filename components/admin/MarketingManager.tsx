'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Gift, Instagram, Loader2, Plus, Save, Search, Timer, Trash2, Upload } from 'lucide-react';
import { fetchStoreProducts, saveSetting, type StoreProduct } from '@/lib/catalog';
import { uploadProductImage } from '@/lib/supabase';
import {
  BUNDLES_KEY,
  EMPTY_FLASH_SALE,
  EMPTY_INSTAGRAM,
  FLASH_SALE_KEY,
  INSTAGRAM_KEY,
  loadJsonSetting,
  type BundleOffer,
  type FlashSale,
  type InstagramFeed,
} from '@/lib/offers';

type Status = { kind: 'ok' | 'err'; text: string } | null;

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition';
const btnCls =
  'inline-flex items-center justify-center gap-2 bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/50 font-bold px-4 py-2.5 rounded-lg text-sm transition disabled:opacity-50';
const labelCls = 'text-xs font-bold text-gray-700 block mb-1';

function Notice({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={`text-xs font-medium flex items-center gap-1.5 ${status.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
      {status.kind === 'ok' && <CheckCircle size={13} />}
      {status.text}
    </p>
  );
}

function Card({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0d0d0d] text-[#E8C34A] flex items-center justify-center flex-shrink-0">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </label>
  );
}

function toLocalInput(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function clampInt(v: string, min: number, max: number) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

function isHttpsUrl(url: string) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function FlashSaleCard({ products }: { products: StoreProduct[] }) {
  const [sale, setSale] = useState<FlashSale>(EMPTY_FLASH_SALE);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    loadJsonSetting<FlashSale>(FLASH_SALE_KEY, EMPTY_FLASH_SALE).then((f) => {
      setSale({ ...EMPTY_FLASH_SALE, ...f, productIds: Array.isArray(f.productIds) ? f.productIds : [] });
      setLoaded(true);
    });
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? products.filter((p) => p.title.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)) : products;
  }, [products, q]);

  const toggleProduct = (id: string) =>
    setSale((s) => ({ ...s, productIds: s.productIds.includes(id) ? s.productIds.filter((x) => x !== id) : [...s.productIds, id] }));

  const save = async () => {
    setStatus(null);
    if (sale.enabled && (!sale.endsAt || new Date(sale.endsAt).getTime() <= Date.now())) {
      setStatus({ kind: 'err', text: 'শেষ হওয়ার সময় ভবিষ্যতের হতে হবে।' });
      return;
    }
    setBusy(true);
    try {
      await saveSetting(FLASH_SALE_KEY, JSON.stringify({ ...sale, title: sale.title.trim(), subtitle: sale.subtitle.trim() }));
      setStatus({ kind: 'ok', text: 'ফ্ল্যাশ সেল সেভ হয়েছে।' });
    } catch {
      setStatus({ kind: 'err', text: 'সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  };

  const live = sale.enabled && sale.endsAt && new Date(sale.endsAt).getTime() > Date.now();

  return (
    <Card icon={<Timer size={18} />} title="ফ্ল্যাশ সেল ও কাউন্টডাউন" sub="হোমপেজ ও প্রোডাক্ট পেজে কাউন্টডাউন সহ ব্যানার দেখাবে। ছাড় চেকআউটে নিজে থেকে যোগ হবে।">
      {!loaded ? (
        <Loader2 className="animate-spin text-gray-400" size={18} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Toggle checked={sale.enabled} onChange={(v) => setSale((s) => ({ ...s, enabled: v }))} label="ফ্ল্যাশ সেল চালু" />
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${live ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
              {live ? 'এখন চলছে' : 'বন্ধ / শেষ'}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>শিরোনাম</label>
              <input className={inputCls} value={sale.title} maxLength={60} placeholder="Eid Flash Sale" onChange={(e) => setSale((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>সাব-টাইটেল</label>
              <input className={inputCls} value={sale.subtitle} maxLength={120} placeholder="সব আবায়াতে বিশেষ ছাড়" onChange={(e) => setSale((s) => ({ ...s, subtitle: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>শেষ হওয়ার সময়</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocalInput(sale.endsAt)}
                onChange={(e) => setSale((s) => ({ ...s, endsAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
              />
            </div>
            <div>
              <label className={labelCls}>ছাড় (%)</label>
              <input type="number" min={0} max={90} className={inputCls} value={sale.percent} onChange={(e) => setSale((s) => ({ ...s, percent: clampInt(e.target.value, 0, 90) }))} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>প্রোডাক্ট নির্বাচন ({sale.productIds.length === 0 ? 'সব প্রোডাক্ট' : `${sale.productIds.length}টি`})</label>
              {sale.productIds.length > 0 && (
                <button type="button" onClick={() => setSale((s) => ({ ...s, productIds: [] }))} className="text-[11px] font-bold text-red-600 hover:underline">
                  সব সরান
                </button>
              )}
            </div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputCls} pl-8`} placeholder="প্রোডাক্ট খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {filtered.map((p) => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={sale.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-emerald-700" />
                  {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />}
                  <span className="text-sm text-gray-800 flex-1 truncate">{p.title}</span>
                  <span className="text-[11px] text-gray-400">₹{p.basePrice}</span>
                </label>
              ))}
              {filtered.length === 0 && <p className="text-xs text-gray-400 p-3">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">কিছু নির্বাচন না করলে সব প্রোডাক্টে ছাড় প্রযোজ্য হবে।</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={save} disabled={busy} className={btnCls}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} সেভ করুন
            </button>
            <Notice status={status} />
          </div>
        </div>
      )}
    </Card>
  );
}

function newBundle(): BundleOffer {
  return { id: crypto.randomUUID(), enabled: true, title: '', kind: 'qty_percent', category: '', minQty: 2, percent: 10, giftText: '' };
}

function BundlesCard({ categories }: { categories: string[] }) {
  const [bundles, setBundles] = useState<BundleOffer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    loadJsonSetting<BundleOffer[]>(BUNDLES_KEY, []).then((b) => {
      setBundles(Array.isArray(b) ? b : []);
      setLoaded(true);
    });
  }, []);

  const patch = (id: string, p: Partial<BundleOffer>) => setBundles((list) => list.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const save = async () => {
    setStatus(null);
    const bad = bundles.find((b) => !b.title.trim() || (b.kind === 'free_gift' && !b.giftText.trim()) || (b.kind === 'qty_percent' && b.percent <= 0));
    if (bad) {
      setStatus({ kind: 'err', text: 'প্রতিটি অফারের নাম এবং ছাড় / উপহার দিন।' });
      return;
    }
    setBusy(true);
    try {
      await saveSetting(BUNDLES_KEY, JSON.stringify(bundles.map((b) => ({ ...b, title: b.title.trim(), giftText: b.giftText.trim() }))));
      setStatus({ kind: 'ok', text: 'কম্বো অফার সেভ হয়েছে।' });
    } catch {
      setStatus({ kind: 'err', text: 'সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={<Gift size={18} />} title="কম্বো ও বান্ডেল অফার" sub="যেমন: '১টি আবায়া কিনলে ১টি হিজাব ফ্রি' অথবা '২টি কিনলে অতিরিক্ত ১০% ছাড়'। প্রোডাক্ট পেজ ও চেকআউটে দেখাবে।">
      {!loaded ? (
        <Loader2 className="animate-spin text-gray-400" size={18} />
      ) : (
        <div className="space-y-3">
          {bundles.length === 0 && <p className="text-sm text-gray-400 italic">এখনো কোনো অফার নেই।</p>}
          {bundles.map((b) => (
            <div key={b.id} className={`border rounded-xl p-4 space-y-3 transition ${b.enabled ? 'border-[#D4AF37]/40 bg-[#FFFBEB]/40' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
              <div className="flex items-center justify-between gap-2">
                <Toggle checked={b.enabled} onChange={(v) => patch(b.id, { enabled: v })} label="চালু" />
                <button type="button" onClick={() => setBundles((l) => l.filter((x) => x.id !== b.id))} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>অফারের নাম</label>
                  <input className={inputCls} value={b.title} maxLength={80} placeholder="Buy 1 Abaya Get 1 Hijab Free" onChange={(e) => patch(b.id, { title: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>অফারের ধরন</label>
                  <select className={inputCls} value={b.kind} onChange={(e) => patch(b.id, { kind: e.target.value as BundleOffer['kind'] })}>
                    <option value="qty_percent">বেশি কিনলে % ছাড়</option>
                    <option value="free_gift">কিনলে ফ্রি উপহার</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>ক্যাটাগরি</label>
                  <select className={inputCls} value={b.category} onChange={(e) => patch(b.id, { category: e.target.value })}>
                    <option value="">সব ক্যাটাগরি</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>সর্বনিম্ন পরিমাণ</label>
                  <input type="number" min={1} max={20} className={inputCls} value={b.minQty} onChange={(e) => patch(b.id, { minQty: clampInt(e.target.value, 1, 20) })} />
                </div>
                {b.kind === 'qty_percent' ? (
                  <div>
                    <label className={labelCls}>অতিরিক্ত ছাড় (%)</label>
                    <input type="number" min={1} max={90} className={inputCls} value={b.percent} onChange={(e) => patch(b.id, { percent: clampInt(e.target.value, 0, 90) })} />
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>ফ্রি উপহার</label>
                    <input className={inputCls} value={b.giftText} maxLength={60} placeholder="Premium Hijab" onChange={(e) => patch(b.id, { giftText: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <button type="button" onClick={() => setBundles((l) => [...l, newBundle()])} className="inline-flex items-center gap-2 border border-dashed border-gray-300 hover:border-[#D4AF37] text-gray-700 font-bold px-4 py-2.5 rounded-lg text-sm transition">
              <Plus size={15} /> নতুন অফার
            </button>
            <button onClick={save} disabled={busy} className={btnCls}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} সেভ করুন
            </button>
            <Notice status={status} />
          </div>
        </div>
      )}
    </Card>
  );
}

function InstagramCard() {
  const [feed, setFeed] = useState<InstagramFeed>(EMPTY_INSTAGRAM);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    loadJsonSetting<InstagramFeed>(INSTAGRAM_KEY, EMPTY_INSTAGRAM).then((f) => {
      setFeed({ ...EMPTY_INSTAGRAM, ...f, posts: Array.isArray(f.posts) ? f.posts : [] });
      setLoaded(true);
    });
  }, []);

  const patchPost = (i: number, p: Partial<InstagramFeed['posts'][number]>) =>
    setFeed((f) => ({ ...f, posts: f.posts.map((x, k) => (k === i ? { ...x, ...p } : x)) }));

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setStatus(null);
    try {
      for (const file of Array.from(files).slice(0, 12 - feed.posts.length)) {
        const url = await uploadProductImage(file);
        setFeed((f) => ({ ...f, posts: [...f.posts, { image: url, link: '' }] }));
      }
    } catch {
      setStatus({ kind: 'err', text: 'ছবি আপলোড হয়নি।' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setStatus(null);
    if (feed.profileUrl && !isHttpsUrl(feed.profileUrl)) {
      setStatus({ kind: 'err', text: 'প্রোফাইল লিংক https:// দিয়ে শুরু হতে হবে।' });
      return;
    }
    const posts = feed.posts.filter((p) => isHttpsUrl(p.image)).map((p) => ({ image: p.image.trim(), link: isHttpsUrl(p.link) ? p.link.trim() : '' }));
    setBusy(true);
    try {
      const clean = { handle: feed.handle.trim().replace(/^@/, ''), profileUrl: feed.profileUrl.trim(), posts };
      await saveSetting(INSTAGRAM_KEY, JSON.stringify(clean));
      setFeed(clean);
      setStatus({ kind: 'ok', text: 'ইনস্টাগ্রাম গ্যালারি সেভ হয়েছে।' });
    } catch {
      setStatus({ kind: 'err', text: 'সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={<Instagram size={18} />} title="ইনস্টাগ্রাম গ্যালারি" sub="হোমপেজে ইনস্টাগ্রাম ছবির গ্রিড দেখাবে। ছবি আপলোড করুন বা ছবির লিংক দিন, প্রতিটির সাথে পোস্টের লিংক যোগ করতে পারেন।">
      {!loaded ? (
        <Loader2 className="animate-spin text-gray-400" size={18} />
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ইনস্টাগ্রাম ইউজারনেম</label>
              <input className={inputCls} value={feed.handle} maxLength={40} placeholder="falah.store" onChange={(e) => setFeed((f) => ({ ...f, handle: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>প্রোফাইল লিংক</label>
              <input className={inputCls} value={feed.profileUrl} placeholder="https://instagram.com/falah.store" onChange={(e) => setFeed((f) => ({ ...f, profileUrl: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {feed.posts.map((p, i) => (
              <div key={`${p.image}-${i}`} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <div className="relative aspect-square bg-gray-100">
                  {isHttpsUrl(p.image) && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                  <button
                    type="button"
                    onClick={() => setFeed((f) => ({ ...f, posts: f.posts.filter((_, k) => k !== i) }))}
                    className="absolute top-1.5 right-1.5 bg-white/90 text-red-600 p-1.5 rounded-full shadow"
                    aria-label="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input className="w-full text-[11px] px-2 py-1.5 border-t border-gray-200 focus:outline-none" placeholder="পোস্টের লিংক (ঐচ্ছিক)" value={p.link} onChange={(e) => patchPost(i, { link: e.target.value })} />
              </div>
            ))}
            {feed.posts.length < 12 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-500 cursor-pointer transition">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <span className="text-xs font-bold">ছবি আপলোড</span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </div>
          <p className="text-[11px] text-gray-400">সর্বোচ্চ ১২টি ছবি। ছবি না দিলে স্টোরের প্রোডাক্ট ছবি দেখাবে।</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={save} disabled={busy || uploading} className={btnCls}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} সেভ করুন
            </button>
            <Notice status={status} />
          </div>
        </div>
      )}
    </Card>
  );
}

export default function MarketingManager() {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    fetchStoreProducts(true)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products]);

  return (
    <div className="space-y-6 max-w-4xl">
      <FlashSaleCard products={products} />
      <BundlesCard categories={categories} />
      <InstagramCard />
    </div>
  );
}
