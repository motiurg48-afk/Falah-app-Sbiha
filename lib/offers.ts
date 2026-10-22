'use client';
import { useEffect, useState } from 'react';
import { fetchSetting } from '@/lib/catalog';

export type FlashSale = {
  enabled: boolean;
  title: string;
  subtitle: string;
  endsAt: string;
  percent: number;
  productIds: string[];
};

export type BundleKind = 'qty_percent' | 'free_gift';

export type BundleOffer = {
  id: string;
  enabled: boolean;
  title: string;
  kind: BundleKind;
  category: string;
  minQty: number;
  percent: number;
  giftText: string;
};

export type InstagramFeed = {
  handle: string;
  profileUrl: string;
  posts: { image: string; link: string }[];
};

export type OfferLine = { label: string; amount: number };

export type PricedItem = { productId: string; category: string; unitPrice: number; qty: number };

export const FLASH_SALE_KEY = 'flash_sale';
export const BUNDLES_KEY = 'bundle_offers';
export const INSTAGRAM_KEY = 'instagram_feed';

export const EMPTY_FLASH_SALE: FlashSale = {
  enabled: false,
  title: '',
  subtitle: '',
  endsAt: '',
  percent: 0,
  productIds: [],
};

export const EMPTY_INSTAGRAM: InstagramFeed = { handle: '', profileUrl: '', posts: [] };

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadJsonSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    return parseJson<T>(await fetchSetting(key), fallback);
  } catch {
    return fallback;
  }
}

export function isFlashLive(sale: FlashSale | null, now = Date.now()): sale is FlashSale {
  return Boolean(sale?.enabled && sale.endsAt && new Date(sale.endsAt).getTime() > now);
}

export function flashAppliesTo(sale: FlashSale, productId: string) {
  return sale.productIds.length === 0 || sale.productIds.includes(productId);
}

function bundleMatches(b: BundleOffer, category: string) {
  return !b.category || b.category === category;
}

export function bundlesForCategory(bundles: BundleOffer[], category: string) {
  return bundles.filter((b) => b.enabled && bundleMatches(b, category));
}

export function computeOffers(
  items: PricedItem[],
  flash: FlashSale | null,
  bundles: BundleOffer[]
): { lines: OfferLine[]; gifts: string[]; total: number } {
  const lines: OfferLine[] = [];
  const gifts: string[] = [];

  if (isFlashLive(flash) && flash.percent > 0) {
    const eligible = items.filter((i) => flashAppliesTo(flash, i.productId));
    const base = eligible.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const amount = Math.round((base * flash.percent) / 100);
    if (amount > 0) lines.push({ label: `${flash.title || 'Flash Sale'} (${flash.percent}%)`, amount });
  }

  for (const b of bundles) {
    if (!b.enabled) continue;
    const eligible = items.filter((i) => bundleMatches(b, i.category));
    const qty = eligible.reduce((s, i) => s + i.qty, 0);
    if (qty < Math.max(1, b.minQty)) continue;
    if (b.kind === 'qty_percent' && b.percent > 0) {
      const base = eligible.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const amount = Math.round((base * b.percent) / 100);
      if (amount > 0) lines.push({ label: b.title, amount });
    } else if (b.kind === 'free_gift' && b.giftText.trim()) {
      gifts.push(b.giftText.trim());
    }
  }

  return { lines, gifts, total: lines.reduce((s, l) => s + l.amount, 0) };
}

export function useStoreOffers() {
  const [flash, setFlash] = useState<FlashSale | null>(null);
  const [bundles, setBundles] = useState<BundleOffer[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadJsonSetting<FlashSale>(FLASH_SALE_KEY, EMPTY_FLASH_SALE),
      loadJsonSetting<BundleOffer[]>(BUNDLES_KEY, []),
    ]).then(([f, b]) => {
      if (!alive) return;
      setFlash({ ...EMPTY_FLASH_SALE, ...f, productIds: Array.isArray(f.productIds) ? f.productIds : [] });
      setBundles(Array.isArray(b) ? b : []);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { flash, bundles };
}

export function useCountdown(endsAt: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const diff = endsAt ? Math.max(0, new Date(endsAt).getTime() - now) : 0;
  return {
    done: diff <= 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
