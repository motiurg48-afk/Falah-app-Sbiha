'use client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = 'product-images';

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get image URL');
  return data.publicUrl;
}

export type ReviewMedia = { type: 'image' | 'video'; url: string };

export type ProductReview = {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  media: ReviewMedia[] | null;
  created_at: string;
};

const REVIEW_BUCKET = 'review-media';

export function isOwnStorageUrl(url: string) {
  return Boolean(supabaseUrl) && url.startsWith(`${supabaseUrl}/storage/v1/object/public/`);
}

export async function uploadReviewMedia(file: File): Promise<ReviewMedia> {
  const type: ReviewMedia['type'] = file.type.startsWith('video/') ? 'video' : 'image';
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
  const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from(REVIEW_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(REVIEW_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get media URL');
  return { type, url: data.publicUrl };
}

export async function fetchReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, product_id, name, rating, comment, photo_url, media, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductReview[];
}

export async function submitReview(review: {
  productId: string;
  name: string;
  rating: number;
  comment: string;
  media: ReviewMedia[];
}) {
  const { error } = await supabase.from('product_reviews').insert({
    product_id: review.productId,
    name: review.name,
    rating: review.rating,
    comment: review.comment || null,
    photo_url: review.media.find((m) => m.type === 'image')?.url ?? null,
    media: review.media,
    status: 'approved',
  });
  if (error) throw error;
}

export type ReturnRequest = {
  id: string;
  order_id: string;
  phone: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

export async function submitReturnRequest(req: {
  orderId: string;
  phone: string;
  reason: string;
  details: string;
}) {
  const { error } = await supabase.from('return_requests').insert({
    order_id: req.orderId,
    phone: req.phone,
    reason: req.reason,
    details: req.details || null,
    status: 'pending',
  });
  if (error) throw error;
}

export async function fetchReturnRequests(): Promise<ReturnRequest[]> {
  const { data, error } = await supabase
    .from('return_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReturnRequest[];
}

export type DbOrder = {
  id: string;
  order_code: string | null;
  product_id: string;
  product_title: string;
  variant_chosen: string | null;
  size_chosen: string | null;
  custom_measurements: { length?: string; chest?: string; sleeve?: string } | null;
  total_amount: number;
  shipping_charge: number | null;
  service_charge: number | null;
  customer: Record<string, string>;
  payment_utr: string | null;
  payment_screenshot: string | null;
  design_sample: string | null;
  discount_amount: number | null;
  promo_code: string | null;
  order_items: { title: string; variant: string; size: string; qty: number; price: number; note?: string }[] | null;
  custom_note: string | null;
  status: string;
  courier_name: string | null;
  awb_number: string | null;
  tracking_url: string | null;
  created_at: string;
};
export async function saveOrderToDb(order: {
  orderCode: string;
  productId: string;
  productTitle: string;
  variantChosen: string;
  sizeChosen: string;
  customMeasurements: { length: string; chest: string; sleeve: string };
  totalAmount: number;
  shippingCharge: number;
  serviceCharge: number;
  customer: Record<string, string>;
  paymentUtr: string;
  paymentScreenshot: string | null;
  designSample: string | null;
  discountAmount: number;
  promoCode: string | null;
  orderItems: { title: string; variant: string; size: string; qty: number; price: number; note?: string }[] | null;
  customNote: string;
  giftWrap?: boolean;
  giftNote?: string;
}) {
  const { error } = await supabase.from('orders').insert({
    order_code: order.orderCode,
    product_id: order.productId,
    product_title: order.productTitle,
    variant_chosen: order.variantChosen,
    size_chosen: order.sizeChosen,
    custom_measurements: order.customMeasurements,
    total_amount: order.totalAmount,
    shipping_charge: order.shippingCharge,
    service_charge: order.serviceCharge,
    customer: order.customer,
    payment_utr: order.paymentUtr || null,
    payment_screenshot: order.paymentScreenshot,
    design_sample: order.designSample ?? null,
    discount_amount: order.discountAmount ?? 0,
    promo_code: order.promoCode ?? null,
    order_items: order.orderItems ?? null,
    custom_note: order.customNote || null,
    gift_wrap: order.giftWrap ?? false,
    gift_note: order.giftNote || null,
    status: 'pending',
  });
  if (error) throw error;
}

export async function fetchDbOrders(): Promise<DbOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbOrder[];
}

export type PromoCode = {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  active: boolean;
  created_at: string;
};

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PromoCode[];
}

export async function createPromoCode(code: string, type: 'percent' | 'flat', value: number) {
  const { error } = await supabase.from('promo_codes').insert({ code, type, value, active: true });
  if (error) throw error;
}

export type Faq = {
  id: string;
  question: string;
  answer: string;
  keywords: string | null;
  sort_order: number;
  created_at: string;
};

export async function fetchFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Faq[];
}

export async function createFaq(question: string, answer: string, keywords: string | null, sortOrder: number) {
  const { error } = await supabase.from('faqs').insert({ question, answer, keywords, sort_order: sortOrder });
  if (error) throw error;
}

export async function updateFaq(id: string, fields: { question: string; answer: string; keywords: string | null }) {
  const { error } = await supabase.from('faqs').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
}

export type ChatLog = {
  id: string;
  session_id: string | null;
  question: string;
  answer: string | null;
  source: string;
  created_at: string;
};

export async function fetchChatLogs(): Promise<ChatLog[]> {
  const { data, error } = await supabase
    .from('chat_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ChatLog[];
}

export async function fetchBestSellers(): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_best_sellers')
    .select('product_id');
  if (error) throw error;
  return (data ?? []).map((r: { product_id: string }) => r.product_id);
}

export async function addBestSeller(productId: string) {
  const { error } = await supabase
    .from('product_best_sellers')
    .upsert({ product_id: productId }, { onConflict: 'product_id' });
  if (error) throw error;
}

export async function removeBestSeller(productId: string) {
  const { error } = await supabase
    .from('product_best_sellers')
    .delete()
    .eq('product_id', productId);
  if (error) throw error;
}

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(input: {
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
  parent_id?: string | null;
}) {
  const { error } = await supabase.from('categories').insert({
    name: input.name,
    slug: input.slug,
    icon: input.icon ?? null,
    sort_order: input.sort_order ?? 0,
    is_active: true,
    parent_id: input.parent_id ?? null,
  });
  if (error) throw error;
}

export async function updateCategory(id: string, fields: Partial<Omit<Category, 'id' | 'created_at'>>) {
  const { error } = await supabase.from('categories').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadDesignSample(file: File): Promise<string> {  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const path = `design-samples/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get image URL');
  return data.publicUrl;
}
