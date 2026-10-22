'use client';
import React, { useEffect, useState } from 'react';
import { Star, Camera, X, Video, Play, Loader2, BadgeCheck } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import {
  fetchReviews,
  submitReview,
  uploadReviewMedia,
  isOwnStorageUrl,
  type ProductReview,
  type ReviewMedia,
} from '@/lib/supabase';

const MAX_MEDIA = 6;
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 25;
const MAX_VIDEO_SECONDS = 60;

function Stars({ value, size = 14, className = 'text-amber-500' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= value ? 'currentColor' : 'none'} className={i <= value ? '' : 'text-gray-300'} />
      ))}
    </span>
  );
}

function videoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    v.src = url;
  });
}

function reviewMedia(r: ProductReview): ReviewMedia[] {
  const list = Array.isArray(r.media) ? r.media : [];
  const all = list.length > 0 ? list : r.photo_url ? [{ type: 'image' as const, url: r.photo_url }] : [];
  return all.filter((m) => (m.type === 'image' || m.type === 'video') && typeof m.url === 'string' && isOwnStorageUrl(m.url));
}

function MediaThumb({ m, onClick, size = 'w-20 h-20' }: { m: ReviewMedia; onClick?: () => void; size?: string }) {
  return (
    <button type="button" onClick={onClick} className={`relative ${size} rounded-lg overflow-hidden border border-gray-200 bg-gray-900 flex-shrink-0 group`}>
      {m.type === 'image' ? (
        <img src={m.url} alt="Review" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <>
          <video src={`${m.url}#t=0.5`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow">
              <Play size={13} className="text-gray-900 ml-0.5" fill="currentColor" />
            </span>
          </span>
        </>
      )}
    </button>
  );
}

function MediaViewer({ media, index, onClose }: { media: ReviewMedia[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const m = media[i];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % media.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + media.length) % media.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [media.length, onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10" aria-label="Close">
        <X size={22} />
      </button>
      <div className="max-w-3xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {m.type === 'image' ? (
          <img src={m.url} alt="Review" className="max-h-[78vh] max-w-full object-contain rounded-lg" />
        ) : (
          <video key={m.url} src={m.url} controls autoPlay playsInline className="max-h-[78vh] max-w-full rounded-lg bg-black" />
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          {media.map((x, k) => (
            <div key={x.url} className={`rounded-lg ring-2 transition ${k === i ? 'ring-[#E8C34A]' : 'ring-transparent opacity-60 hover:opacity-100'}`}>
              <MediaThumb m={x} onClick={() => setI(k)} size="w-14 h-14" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const { t } = useLang();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [uploading, setUploading] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState<{ media: ReviewMedia[]; index: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'media'>('all');

  const load = async () => {
    try {
      setReviews(await fetchReviews(productId));
    } catch {
      setReviews([]);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    setLoaded(false);
    setShowForm(false);
    setDone(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const allMedia = reviews.flatMap(reviewMedia);
  const shown = filter === 'media' ? reviews.filter((r) => reviewMedia(r).length > 0) : reviews;

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setError('');
    const room = MAX_MEDIA - media.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(t('reviewMediaMax').replace('{n}', String(MAX_MEDIA)));
    for (const file of picked) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) continue;
      if (file.size > (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024) {
        setError(t('reviewMediaTooBig').replace('{mb}', String(isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB)));
        continue;
      }
      if (isVideo && (await videoDuration(file)) > MAX_VIDEO_SECONDS) {
        setError(t('reviewVideoTooLong').replace('{s}', String(MAX_VIDEO_SECONDS)));
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const m = await uploadReviewMedia(file);
        setMedia((prev) => (prev.length < MAX_MEDIA ? [...prev, m] : prev));
      } catch {
        setError(t('reviewUploadFail'));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rating === 0) {
      setError(`${t('yourName')} / ${t('yourRating')}`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await submitReview({ productId, name: name.trim().slice(0, 80), rating, comment: comment.trim().slice(0, 2000), media });
      setDone(true);
      setShowForm(false);
      setName('');
      setRating(0);
      setComment('');
      setMedia([]);
      await load();
    } catch {
      setError(t('reviewSubmitFail'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <Star size={15} className="text-amber-500" fill="currentColor" /> {t('reviewsTitle')}
        </h4>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
        >
          {showForm ? <X size={12} className="inline" /> : '+ '}
          {t('writeReview')}
        </button>
      </div>

      {loaded && reviews.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Stars value={Math.round(avg)} size={13} />
          <span className="font-bold text-gray-800">{avg.toFixed(1)}</span>
          <span className="text-gray-400">
            ({reviews.length} {t('reviewsCount')})
          </span>
        </div>
      )}

      {allMedia.length > 0 && (
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">{t('customerPhotos')}</span>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {allMedia.slice(0, 12).map((m, i) => (
              <MediaThumb key={m.url} m={m} size="w-16 h-16" onClick={() => setViewer({ media: allMedia, index: i })} />
            ))}
          </div>
        </div>
      )}

      {done && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-900 font-semibold">{t('reviewThanks')}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            placeholder={t('yourName')}
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
          />
          <div>
            <span className="text-xs font-bold text-gray-700 block mb-1">{t('yourRating')}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${i} star`}
                >
                  <Star
                    size={24}
                    fill={i <= (hoverRating || rating) ? 'currentColor' : 'none'}
                    className={i <= (hoverRating || rating) ? 'text-amber-500' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            placeholder={t('yourComment')}
            value={comment}
            maxLength={2000}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 resize-none"
          />
          <div>
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
              <Camera size={13} /> {t('reviewMediaLabel')}
              <span className="font-normal text-gray-400">
                ({media.length}/{MAX_MEDIA})
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div key={m.url} className="relative">
                  <MediaThumb m={m} onClick={() => setViewer({ media, index: i })} />
                  <button
                    type="button"
                    onClick={() => setMedia((prev) => prev.filter((x) => x.url !== m.url))}
                    className="absolute -top-1.5 -right-1.5 bg-white text-red-600 rounded-full p-0.5 shadow border border-gray-200"
                    aria-label="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {uploading > 0 && (
                <div className="w-20 h-20 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-emerald-700" />
                </div>
              )}
              {media.length + uploading < MAX_MEDIA && (
                <label className="w-20 h-20 cursor-pointer rounded-lg border border-dashed border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50 transition flex flex-col items-center justify-center gap-1 text-gray-500">
                  <span className="flex items-center gap-1">
                    <Camera size={15} />
                    <Video size={15} />
                  </span>
                  <span className="text-[10px] font-bold">{t('reviewAddMedia')}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{t('reviewMediaHint').replace('{s}', String(MAX_VIDEO_SECONDS))}</p>
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={submitting || uploading > 0}
            className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-2 rounded-lg text-xs transition"
          >
            {submitting ? t('processing') : t('reviewSubmit')}
          </button>
        </form>
      )}

      {loaded && reviews.length === 0 && !showForm && <p className="text-xs text-gray-400 italic">{t('noReviews')}</p>}

      {reviews.length > 0 && allMedia.length > 0 && (
        <div className="flex gap-1.5">
          {(['all', 'media'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                filter === f ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? t('reviewFilterAll') : t('reviewFilterMedia')}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {shown.map((r) => {
          const rm = reviewMedia(r);
          return (
            <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    {r.name}
                    {rm.length > 0 && <BadgeCheck size={12} className="text-emerald-600" />}
                  </span>
                  <Stars value={r.rating} size={11} className="mt-0.5" />
                </div>
                <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">{r.comment}</p>}
              {rm.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {rm.map((m, i) => (
                    <MediaThumb key={m.url} m={m} onClick={() => setViewer({ media: rm, index: i })} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewer && <MediaViewer media={viewer.media} index={viewer.index} onClose={() => setViewer(null)} />}
    </div>
  );
}
