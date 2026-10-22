'use client';
import React, { useState } from 'react';
import { Share2, MessageCircle, Facebook, Send, Link2, Check } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function ShareButtons({ productId, title, price }: { productId: string; title: string; price: number }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const url = () => `${window.location.origin}/?product=${encodeURIComponent(productId)}`;
  const text = () => `${title} — ₹${price} | FALAH`;

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

  const shareWhatsApp = () => open(`https://wa.me/?text=${encodeURIComponent(`${text()}\n${url()}`)}`);
  const shareFacebook = () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`);
  const shareMessenger = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(url())}`;
    } else {
      open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const btn = 'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-lg transition hover:-translate-y-0.5 hover:shadow-md';

  return (
    <div>
      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2">
        <Share2 size={13} /> {t('shareProduct')}
      </span>
      <div className="flex gap-2">
        <button onClick={shareWhatsApp} className={`${btn} bg-[#25D366] text-white`}>
          <MessageCircle size={14} /> WhatsApp
        </button>
        <button onClick={shareFacebook} className={`${btn} bg-[#1877F2] text-white`}>
          <Facebook size={14} /> Facebook
        </button>
        <button onClick={shareMessenger} className={`${btn} bg-gradient-to-r from-[#0099FF] to-[#0066FF] text-white`}>
          <Send size={14} /> Messenger
        </button>
        <button
          onClick={copy}
          className={`px-3 rounded-lg border transition ${copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
          aria-label={t('copyLink')}
          title={t('copyLink')}
        >
          {copied ? <Check size={14} /> : <Link2 size={14} />}
        </button>
      </div>
    </div>
  );
}
