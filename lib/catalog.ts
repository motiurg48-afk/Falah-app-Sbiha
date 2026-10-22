'use client';
import { supabase, uploadProductImage } from './supabase';

export type StoreProduct = {
  id: string;
  dbId: string;
  title: string;
  category: string;
  basePrice: number;
  regularPrice?: number;
  fabric?: string;
  description?: string;
  image?: string;
  images?: string[];
  isOutOfStock?: boolean;
  manualOutOfStock: boolean;
  stock: number | null;
  isActive: boolean;
  sortOrder: number;
  slug: string;
  createdAt: string;
  [key: string]: unknown;
};

type ProductRow = {
  id: string;
  product_key: string;
  slug: string;
  title: string;
  category: string | null;
  base_price: number | null;
  regular_price: number | null;
  fabric: string | null;
  description: string | null;
  data: Record<string, unknown> | null;
  stock: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
};

const CORE_KEYS = new Set([
  'id', 'dbId', 'title', 'category', 'basePrice', 'regularPrice', 'fabric', 'description',
  'stock', 'isActive', 'sortOrder', 'slug', 'createdAt', 'manualOutOfStock',
]);

function rowToProduct(r: ProductRow): StoreProduct {
  const data = r.data ?? {};
  return {
    ...data,
    id: r.product_key,
    dbId: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category ?? '',
    basePrice: r.base_price ?? 0,
    regularPrice: r.regular_price ?? undefined,
    fabric: r.fabric ?? undefined,
    description: r.description ?? undefined,
    stock: r.stock,
    isActive: r.is_active !== false,
    sortOrder: r.sort_order ?? 0,
    createdAt: r.created_at,
    manualOutOfStock: Boolean(data.isOutOfStock),
    isOutOfStock: Boolean(data.isOutOfStock) || r.stock === 0,
  };
}

export async function fetchStoreProducts(includeInactive = false): Promise<StoreProduct[]> {
  let q = supabase
    .from('products')
    .select('id, product_key, slug, title, category, base_price, regular_price, fabric, description, data, stock, is_active, sort_order, created_at')
    .not('product_key', 'is', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as ProductRow[]).map(rowToProduct);
}

export type ProductInput = {
  title: string;
  category: string;
  basePrice: number;
  regularPrice?: number | null;
  fabric?: string | null;
  description?: string | null;
  stock?: number | null;
  extra: Record<string, unknown>;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'product';
}

export async function createStoreProduct(input: ProductInput) {
  const key = `admin-${Date.now()}`;
  const extra = Object.fromEntries(Object.entries(input.extra).filter(([k]) => !CORE_KEYS.has(k)));
  const { error } = await supabase.from('products').insert({
    product_key: key,
    slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
    title: input.title,
    category: input.category,
    base_price: input.basePrice,
    regular_price: input.regularPrice ?? null,
    fabric: input.fabric ?? null,
    description: input.description ?? null,
    stock: input.stock ?? null,
    data: extra,
    sort_order: -Math.floor(Date.now() / 1000),
    is_active: true,
  });
  if (error) throw error;
}

export async function updateStoreProduct(product: StoreProduct, patch: Partial<ProductInput> & { isActive?: boolean }) {
  const current = Object.fromEntries(Object.entries(product).filter(([k]) => !CORE_KEYS.has(k)));
  const fields: Record<string, unknown> = {
    data: { ...current, isOutOfStock: product.manualOutOfStock, ...(patch.extra ?? {}) },
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) fields.title = patch.title;
  if (patch.category !== undefined) fields.category = patch.category;
  if (patch.basePrice !== undefined) fields.base_price = patch.basePrice;
  if (patch.regularPrice !== undefined) fields.regular_price = patch.regularPrice;
  if (patch.fabric !== undefined) fields.fabric = patch.fabric;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.stock !== undefined) fields.stock = patch.stock;
  if (patch.isActive !== undefined) fields.is_active = patch.isActive;
  const { error } = await supabase.from('products').update(fields).eq('id', product.dbId);
  if (error) throw error;
}

export async function deleteStoreProduct(dbId: string) {
  const { error } = await supabase.from('products').delete().eq('id', dbId);
  if (error) throw error;
}

export function subscribeToTable(table: string, onChange: () => void) {
  const channel = supabase
    .channel(`${table}-changes-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export type HeroBanner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export async function fetchBanners(): Promise<HeroBanner[]> {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HeroBanner[];
}

export async function createBanner(input: { image_url: string; title: string; subtitle: string; link_url: string; sort_order: number }) {
  const { error } = await supabase.from('hero_banners').insert({
    image_url: input.image_url,
    title: input.title || null,
    subtitle: input.subtitle || null,
    link_url: input.link_url || null,
    sort_order: input.sort_order,
    is_active: true,
  });
  if (error) throw error;
}

export async function updateBanner(id: string, fields: Partial<Omit<HeroBanner, 'id' | 'created_at'>>) {
  const { error } = await supabase.from('hero_banners').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from('hero_banners').delete().eq('id', id);
  if (error) throw error;
}

export const uploadBannerImage = uploadProductImage;

export function isSafeLink(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  if (url.startsWith('#')) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function fetchSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return (data?.value as string | null | undefined) ?? null;
}

export async function saveSetting(key: string, value: string) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}
