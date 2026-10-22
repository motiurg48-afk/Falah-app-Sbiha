'use client';
import React, { useState } from 'react';
import { X, Gift, PenLine, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const inputCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 transition';

interface GiftWrapProps {
  giftWrap: boolean;
  setGiftWrap: (v: boolean) => void;
  giftNote: string;
  setGiftNote: (v: string) => void;
}

export default function GiftWrapSection({ giftWrap, setGiftWrap, giftNote, setGiftNote }: GiftWrapProps) {
  const { t } = useLang();

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={giftWrap}
          onChange={(e) => setGiftWrap(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
        />
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-rose-600" />
          <span className="text-sm font-bold text-gray-800">Gift Wrap This Order</span>
        </div>
      </label>

      {giftWrap && (
        <div className="pl-7 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2">
            <PenLine size={14} className="text-gray-400 mt-2 flex-shrink-0" />
            <textarea
              value={giftNote}
              onChange={(e) => setGiftNote(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Write your gift message here (e.g. Happy Birthday! Love, Sarah)"
              className={`${inputCls} resize-none`}
            />
          </div>
          <p className="text-[10px] text-gray-400">{giftNote.length}/200 characters</p>
          <p className="text-[10px] text-rose-600 font-medium">
            +₹49 gift wrap charge will be added to your order.
          </p>
        </div>
      )}
    </div>
  );
}