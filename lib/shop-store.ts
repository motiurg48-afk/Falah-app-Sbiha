'use client';

import { useEffect, useState } from 'react';

const CART_KEY = 'falah_cart';
const WISH_KEY = 'falah_wishlist';

export type CartItem = {
  productId: string;
  productTitle: string;
  category: string;
  image: string | null;
  variantName: string;
  size: string;
  note?: string;
  basePrice: number;
  qty: number;
};

export type WishItem = {
  productId: string;
  productTitle: string;
  category: string;
  image: string | null;
  basePrice: number;
  addedAt: string;
};

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  } catch {
    // ignore
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read<CartItem>(CART_KEY));
    const sync = () => setItems(read<CartItem>(CART_KEY));
    window.addEventListener('storage', sync);
    window.addEventListener('falah-cart-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('falah-cart-change', sync);
    };
  }, []);

  const add = (item: CartItem) => {
    const all = read<CartItem>(CART_KEY);
    const idx = all.findIndex(
      (i) => i.productId === item.productId && i.variantName === item.variantName && i.size === item.size
    );
    if (idx >= 0) {
      all[idx].qty += item.qty;
    } else {
      all.unshift(item);
    }
    write(CART_KEY, all);
    setItems(all);
  };

  const updateQty = (productId: string, variantName: string, size: string, qty: number) => {
    let all = read<CartItem>(CART_KEY);
    if (qty <= 0) {
      all = all.filter((i) => !(i.productId === productId && i.variantName === variantName && i.size === size));
    } else {
      const idx = all.findIndex(
        (i) => i.productId === productId && i.variantName === variantName && i.size === size
      );
      if (idx >= 0) all[idx].qty = qty;
    }
    write(CART_KEY, all);
    setItems(all);
  };

  const remove = (productId: string, variantName: string, size: string) =>
    updateQty(productId, variantName, size, 0);

  const clear = () => {
    write(CART_KEY, []);
    setItems([]);
  };

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.basePrice * i.qty, 0);

  return { items, add, updateQty, remove, clear, count, subtotal };
}

export function useWishlist() {
  const [items, setItems] = useState<WishItem[]>([]);

  useEffect(() => {
    setItems(read<WishItem>(WISH_KEY));
    const sync = () => setItems(read<WishItem>(WISH_KEY));
    window.addEventListener('storage', sync);
    window.addEventListener('falah-wish-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('falah-wish-change', sync);
    };
  }, []);

  const has = (productId: string) => items.some((i) => i.productId === productId);

  const toggle = (item: WishItem) => {
    let all = read<WishItem>(WISH_KEY);
    if (all.some((i) => i.productId === item.productId)) {
      all = all.filter((i) => i.productId !== item.productId);
    } else {
      all.unshift(item);
    }
    write(WISH_KEY, all);
    setItems(all);
  };

  const remove = (productId: string) => {
    const all = read<WishItem>(WISH_KEY).filter((i) => i.productId !== productId);
    write(WISH_KEY, all);
    setItems(all);
  };

  return { items, has, toggle, remove };
}

export function clearCartAfterOrder() {
  write(CART_KEY, []);
}
