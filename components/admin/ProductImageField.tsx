'use client';
import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { uploadProductImage } from '@/lib/supabase';

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
};

export default function ProductImageField({ images, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    let next = [...images];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('শুধু ছবি ফাইল আপলোড করা যাবে।');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('প্রতিটি ছবি ৫ MB এর কম হতে হবে।');
        continue;
      }
      try {
        next = [...next, await uploadProductImage(file)];
        onChange(next);
      } catch {
        setError('ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।');
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeAt = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const makePrimary = (idx: number) => {
    const list = [...images];
    const [picked] = list.splice(idx, 1);
    onChange([picked, ...list]);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-700 block">প্রোডাক্ট ছবি ({images.length})</label>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, idx) => (
            <div key={`${img}-${idx}`} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square group">
              <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-[#0d0d0d] text-[#E8C34A] text-[8px] font-bold px-1.5 py-0.5 rounded">প্রধান</span>
              )}
              <div className="absolute bottom-1 left-1 right-1 flex gap-1">
                {idx !== 0 && (
                  <button type="button" onClick={() => makePrimary(idx)} className="flex-1 bg-white/90 text-gray-800 text-[9px] font-bold rounded py-0.5 shadow hover:bg-white">
                    প্রধান করুন
                  </button>
                )}
                <button type="button" onClick={() => removeAt(idx)} className="flex-1 bg-white/90 text-red-600 text-[9px] font-bold rounded py-0.5 shadow hover:bg-white">
                  মুছুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#D4AF37] hover:text-[#8a6d1d] flex items-center justify-center gap-2 transition bg-gray-50 disabled:opacity-60 text-xs font-bold"
      >
        <ImagePlus size={18} />
        {uploading ? 'আপলোড হচ্ছে...' : images.length > 0 ? 'আরও ছবি যোগ করুন' : 'ছবি আপলোড করুন'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
