'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/lib/shop-store';

const TOKEN_KEY = 'falah_cart_token';
const SIG_KEY = 'falah_cart_sig';
export const CART_TOUCHED_KEY = 'falah_cart_touched';

function getToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function getCartTouchedAt(): number | null {
  try {
    const v = Number(localStorage.getItem(CART_TOUCHED_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function useAbandonedCartTracking(items: CartItem[], contact: { name: string; phone: string }) {
  const itemsSig = items.map((i) => `${i.productId}|${i.variantName}|${i.size}|${i.qty}`).join(',');
  const phone = contact.phone.replace(/\D/g, '').length >= 10 ? contact.phone.trim() : '';
  const name = contact.name.trim();

  useEffect(() => {
    if (items.length === 0) return;
    const sig = `${itemsSig}#${name}#${phone}`;
    let prevSig: string | null = null;
    try {
      prevSig = localStorage.getItem(SIG_KEY);
    } catch {
      return;
    }
    if (prevSig === sig) return;
    if (!prevSig || prevSig.split('#')[0] !== itemsSig) localStorage.setItem(CART_TOUCHED_KEY, String(Date.now()));

    const timer = setTimeout(async () => {
      const { error } = await supabase.rpc('track_abandoned_cart', {
        p_token: getToken(),
        p_name: name,
        p_phone: phone,
        p_items: items.map((i) => ({ title: i.productTitle, variant: i.variantName, size: i.size, qty: i.qty, price: i.basePrice, image: i.image })),
        p_subtotal: items.reduce((s, i) => s + i.basePrice * i.qty, 0),
        p_item_count: items.reduce((s, i) => s + i.qty, 0),
      });
      if (!error) localStorage.setItem(SIG_KEY, sig);
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSig, name, phone]);
}

export async function markCartRecovered() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SIG_KEY);
    localStorage.removeItem(CART_TOUCHED_KEY);
    if (token) await supabase.rpc('mark_cart_recovered', { p_token: token });
  } catch {
    // order is already placed; recovery flag is best-effort
  }
}
