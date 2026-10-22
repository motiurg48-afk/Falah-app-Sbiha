'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle, Eye, EyeOff, ImagePlus, Link2, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createBanner, deleteBanner, fetchBanners, isSafeLink, updateBanner, uploadBannerImage, type HeroBanner } from '@/lib/catalog';

type Draft = { image_url: string; title: string; subtitle: string; link_url: string };
const EMPTY: Draft = { image_url: '', title: '', subtitle: '', link_url: '' };

const field =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition';

function BannerForm({ initial, isEdit, onCancel, onSubmit }: { initial: Draft; isEdit: boolean; onCancel: () => void; onSubmit: (d: Draft) => Promise<void> }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('৫ MB এর কম একটি ছবি বেছে নিন।');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const url = await uploadBannerImage(file);
      setDraft((d) => ({ ...d, image_url: url }));
    } catch {
      setError('ছবি আপলোড করা যায়নি।');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.image_url) {
      setError('একটি ব্যানার ছবি আপলোড করুন।');
      return;
    }
    const link = draft.link_url.trim();
    if (link && !isSafeLink(link)) {
      setError('লিংক অবশ্যই / দিয়ে বা https:// দিয়ে শুরু হতে হবে।');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({ ...draft, title: draft.title.trim(), subtitle: draft.subtitle.trim(), link_url: link });
    } catch {
      setError('সেভ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-[#D4AF37]/40 shadow-sm p-5 space-y-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#D4AF37] bg-gray-50 flex items-center justify-center transition group"
      >
        {draft.image_url ? (
          <>
            <img src={draft.image_url} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">ছবি পরিবর্তন করুন</span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-gray-400 text-xs font-bold">
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            {uploading ? 'আপলোড হচ্ছে...' : 'ব্যানার ছবি আপলোড করুন (চওড়া, যেমন 1600×700)'}
          </span>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="শিরোনাম (ঐচ্ছিক)" maxLength={80} className={field} />
        <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="সাব-টাইটেল (ঐচ্ছিক)" maxLength={140} className={field} />
      </div>
      <div className="relative">
        <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={draft.link_url}
          onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
          placeholder="ক্লিক করলে কোথায় যাবে, যেমন /#products বা https://..."
          className={`${field} pl-9`}
        />
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm hover:bg-gray-50 transition">
          বাতিল
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-4 bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/50 font-bold py-2 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          {isEdit ? 'আপডেট করুন' : 'ব্যানার যোগ করুন'}
        </button>
      </div>
    </form>
  );
}

export default function BannerManager() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<{ kind: 'add' } | { kind: 'edit'; banner: HeroBanner } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    fetchBanners()
      .then((rows) => {
        setBanners(rows);
        setError('');
      })
      .catch(() => setError('ব্যানার লোড করা যায়নি।'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
      await load();
    } catch {
      setError('পরিবর্তন সেভ করা যায়নি।');
    } finally {
      setBusyId(null);
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = banners[idx + dir];
    const current = banners[idx];
    if (!target) return;
    const reordered = [...banners];
    reordered[idx] = target;
    reordered[idx + dir] = current;
    act(current.id, () => Promise.all(reordered.map((b, i) => (b.sort_order === i ? null : updateBanner(b.id, { sort_order: i })))));
  };

  const remove = (b: HeroBanner) => {
    if (!confirm('এই ব্যানারটি মুছে ফেলতে চান?')) return;
    act(b.id, () => deleteBanner(b.id));
  };

  const activeCount = banners.filter((b) => b.is_active).length;

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">হিরো ব্যানার স্লাইডার</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            হোমপেজের উপরের স্লাইডারে {activeCount} টি ব্যানার দেখাচ্ছে। কোনো ব্যানার না থাকলে ডিফল্ট হিরো দেখাবে।
          </p>
        </div>
        {!mode && (
          <button
            onClick={() => setMode({ kind: 'add' })}
            className="flex items-center gap-1.5 text-xs font-bold text-[#E8C34A] bg-[#0d0d0d] border border-[#D4AF37]/50 px-3.5 py-2 rounded-full hover:bg-[#1f1f1f] transition"
          >
            <Plus size={13} /> নতুন ব্যানার
          </button>
        )}
      </div>

      {mode && (
        <BannerForm
          key={mode.kind === 'edit' ? mode.banner.id : 'new'}
          isEdit={mode.kind === 'edit'}
          initial={
            mode.kind === 'edit'
              ? {
                  image_url: mode.banner.image_url,
                  title: mode.banner.title ?? '',
                  subtitle: mode.banner.subtitle ?? '',
                  link_url: mode.banner.link_url ?? '',
                }
              : EMPTY
          }
          onCancel={() => setMode(null)}
          onSubmit={async (d) => {
            if (mode.kind === 'edit') await updateBanner(mode.banner.id, { ...d, title: d.title || null, subtitle: d.subtitle || null, link_url: d.link_url || null });
            else await createBanner({ ...d, sort_order: banners.length });
            setMode(null);
            await load();
          }}
        />
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে...
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          <ImagePlus size={30} className="mx-auto mb-3 text-gray-300" />
          এখনো কোনো ব্যানার নেই। প্রথম ব্যানারটি যোগ করুন।
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div key={b.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col sm:flex-row gap-3 sm:items-center transition ${!b.is_active ? 'opacity-60' : ''}`}>
              <div className="relative w-full sm:w-48 aspect-[21/9] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={b.image_url} alt={b.title ?? 'Banner'} className="w-full h-full object-cover" />
                <span className="absolute top-1.5 left-1.5 bg-black/70 text-[#E8C34A] text-[10px] font-bold px-2 py-0.5 rounded-full">#{idx + 1}</span>
                {busyId === b.id && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{b.title || 'শিরোনাম নেই'}</p>
                {b.subtitle && <p className="text-xs text-gray-500 truncate">{b.subtitle}</p>}
                <p className="text-[11px] text-[#8a6d1d] mt-1 flex items-center gap-1 truncate">
                  <Link2 size={11} /> {b.link_url || 'কোনো লিংক নেই'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => move(idx, -1)} disabled={idx === 0 || busyId !== null} aria-label="Move up" className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === banners.length - 1 || busyId !== null} aria-label="Move down" className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition">
                  <ArrowDown size={14} />
                </button>
                <button onClick={() => act(b.id, () => updateBanner(b.id, { is_active: !b.is_active }))} disabled={busyId !== null} aria-label="Toggle visibility" className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  {b.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => setMode({ kind: 'edit', banner: b })} aria-label="Edit banner" className="p-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(b)} disabled={busyId !== null} aria-label="Delete banner" className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition">
                  <Trash2 size={14} />
                </button>
                {mode?.kind === 'edit' && mode.banner.id === b.id && (
                  <button onClick={() => setMode(null)} aria-label="Cancel edit" className="p-2 rounded-lg text-gray-400 hover:text-gray-700">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
