'use client';
import React, { useEffect, useState } from 'react';
import { Instagram, Heart, ExternalLink } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { EMPTY_INSTAGRAM, INSTAGRAM_KEY, loadJsonSetting, type InstagramFeed as Feed } from '@/lib/offers';

function safeUrl(u: string | undefined) {
  return u && /^https:\/\//i.test(u) ? u : '';
}

export default function InstagramFeed({ fallbackImages }: { fallbackImages: string[] }) {
  const { t } = useLang();
  const [feed, setFeed] = useState<Feed | null>(null);

  useEffect(() => {
    let alive = true;
    loadJsonSetting<Feed>(INSTAGRAM_KEY, EMPTY_INSTAGRAM).then((f) => {
      if (alive) setFeed({ ...EMPTY_INSTAGRAM, ...f, posts: Array.isArray(f.posts) ? f.posts : [] });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!feed) return null;
  const profile = safeUrl(feed.profileUrl) || (feed.handle ? `https://www.instagram.com/${feed.handle.replace(/^@/, '')}/` : '');
  const posts = feed.posts
    .map((p) => ({ image: safeUrl(p.image), link: safeUrl(p.link) || profile }))
    .filter((p) => p.image);
  const tiles = (posts.length > 0 ? posts : fallbackImages.map((image) => ({ image, link: profile }))).slice(0, 8);
  if (tiles.length === 0 || !profile) return null;

  const handle = feed.handle ? `@${feed.handle.replace(/^@/, '')}` : 'Instagram';

  return (
    <section className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-600">
            <Instagram size={13} /> {t('instaKicker')}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mt-1 leading-tight">{t('instaTitle')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('instaSub')}</p>
        </div>
        <a
          href={profile}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start sm:self-auto bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
        >
          <Instagram size={16} /> {t('instaFollow')} {handle}
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {tiles.map((p, i) => (
          <a
            key={`${p.image}-${i}`}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
          >
            <img src={p.image} alt={`${handle} post ${i + 1}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 text-white">
              <Heart size={20} fill="currentColor" />
              <ExternalLink size={18} />
            </span>
            <Instagram size={16} className="absolute top-2 right-2 text-white drop-shadow opacity-90" />
          </a>
        ))}
      </div>
    </section>
  );
}
