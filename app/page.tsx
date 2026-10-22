'use client';
import React, { useEffect, useRef, useState } from 'react';
import productsData from '@/data/products.json';
import { LANGUAGES, useLang, categoryKey, type Lang } from '@/lib/i18n';
import { fetchStoreProducts, fetchBanners, fetchSetting, subscribeToTable, type HeroBanner } from '@/lib/catalog';
import ImageLightbox from '@/components/ImageLightbox';
import ProductSuggestions from '@/components/ProductSuggestions';
import HeroSlider from '@/components/HeroSlider';
import { useCart, useWishlist, clearCartAfterOrder } from '@/lib/shop-store';
import CartDrawer from '@/components/CartDrawer';
import WishlistModal from '@/components/WishlistModal';
import { saveOrderToDb, uploadDesignSample, fetchPromoCodes, fetchBestSellers, type PromoCode } from '@/lib/supabase';
import FloatingWidgets from '@/components/FloatingWidgets';
import { useInvoiceGenerator, getServiceCharge, serviceChargeLabel, type InvoiceData } from '@/lib/invoice';
import PolicyModal from '@/components/PolicyModal';
import TranslatedText from '@/components/TranslatedText';
import SizeGuide from '@/components/product/SizeGuide';
import StockUrgency from '@/components/product/StockUrgency';
import ShareButtons from '@/components/product/ShareButtons';
import DeliveryChecker from '@/components/product/DeliveryChecker';
import ProductOffers from '@/components/product/ProductOffers';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import InstagramFeed from '@/components/InstagramFeed';
import AbandonedCartReminder from '@/components/AbandonedCartReminder';
import { computeOffers, isFlashLive, useStoreOffers, type BundleOffer, type FlashSale } from '@/lib/offers';
import { useAbandonedCartTracking, markCartRecovered } from '@/lib/abandoned-cart';
import ReviewsSection from '@/components/ReviewsSection';
import ReturnRequestModal from '@/components/ReturnRequestModal';
import TrackOrderModal from '@/components/TrackOrderModal';
import { addRewardPoints, calculateEarnedPoints, getCustomerPoints, loadRewardConfig, maxRedeemablePoints, pointsToRupees, type RewardConfig } from '@/lib/rewards';
import BackInStockNotify from '@/components/BackInStockNotify';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import CustomerLoginModal from '@/components/CustomerLoginModal';
import GiftWrapSection from '@/components/GiftWrapSection';
import MyAccountModal from '@/components/MyAccountModal';
import VoiceImageSearch from '@/components/VoiceImageSearch';
import SizeRecommender from '@/components/product/SizeRecommender';
import { getCustomGroups, defaultSelection, optionsTotal, optionsLabel } from '@/lib/variant-engine';
import { pushUiLayer, popUiLayer, setSuppressNextPop } from '@/lib/modal-layer';
import {
  getShippingCharge,
  INDIAN_STATES,
  getDistrictsForState,
  getPoliceStationsForDistrict,
  getAreasForPoliceStation,
} from '@/lib/location-data';
import {
  ArrowLeft,
  ShoppingBag,
  Maximize2,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCw,
  RefreshCcw,
  PhoneCall,
  X,
  Ruler,
  CreditCard,
  Banknote,
  Tag,
  MessageCircle,
  Globe,
  ChevronDown,
  ImageOff,
  Search,
  Copy,
  Upload,
  LayoutGrid,
  Star,
  Award,
  PackageSearch,
  FileDown,
  CircleAlert,
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  User,
} from 'lucide-react';

const WHATSAPP_NUMBER = '919332376959';
const WHATSAPP_SUPPORT_URL =
  'https://wa.me/919332376959?text=Hello%20FALAH,%20I%20have%20an%20inquiry%20about%20your%20products';
const ORDERS_STORAGE_KEY = 'falah_orders';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToUrl(file: File): Promise<string> {
  try {
    const { uploadProductImage } = await import('@/lib/supabase');
    return await uploadProductImage(file);
  } catch {
    return await readFileAsDataUrl(file);
  }
}

type OrderRecord = {
  id: string;
  productId: string;
  productTitle: string;
  variantChosen: string;
  sizeChosen: string;
  customMeasurements: { length: string; chest: string; sleeve: string };
  customNote: string;
  totalAmount: number;
  customer: { name: string; phone: string; address: string; paymentMethod: string };
  paymentUtr: string;
  paymentScreenshot: string | null;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
};

const PAYMENT_DETAILS = {
  upiNumber: '+91 9332376959',
  bankName: 'Punjab National Bank',
  accountHolder: 'Sultana Parvin',
  accountNumber: '6705000100126552',
  ifsc: 'PUNB0670500',
};

const CATEGORIES = [
  'Abaya',
  'Abaya Set',
  'Hijab',
  'Khimar Set',
  'Cotton Borkha',
  'Fashion',
  'Accessories',
  'Books',
  'Gadgets',
  'Home Essentials',
] as const;

const COLOR_HEX: Record<string, string> = {
  Black: '#1f2937',
  'Navy Blue': '#1e3a8a',
  'Bottle Green': '#14532d',
  Maroon: '#7f1d1d',
  Pink: '#f9a8d4',
  Onion: '#c2410c',
  White: '#ffffff',
  Red: '#dc2626',
  Green: '#16a34a',
  Blue: '#2563eb',
  Brown: '#78350f',
  Grey: '#6b7280',
  Gray: '#6b7280',
  Beige: '#e7d8c1',
  Olive: '#6b7231',
  Mustard: '#d9a514',
  Sky: '#7dd3fc',
  'Sky Blue': '#7dd3fc',
  Cherry: '#a4123f',
  'Dubai Cherry': '#a4123f',
  Cream: '#f5f0e1',
};

function buildWhatsAppOrderUrl(
  product: any,
  variantName: string,
  price: number,
  measurements: { length: string; chest: string; sleeve: string },
  customer: { name: string; phone: string; address: string; paymentMethod: string },
  orderUtr?: string,
  note?: string
) {
  const lines = [
    `*New Order — FALAH*`,
    ``,
    `Product: ${product.title}`,
    `Variant: ${variantName}`,
    `Total: ₹${price}`,
  ];
  if (measurements.length || measurements.chest || measurements.sleeve) {
    const m = [
      measurements.length && `Length: ${measurements.length}`,
      measurements.chest && `Chest: ${measurements.chest}`,
      measurements.sleeve && `Sleeve: ${measurements.sleeve}`,
    ].filter(Boolean);
    lines.push(`Custom measurements: ${m.join(', ')}`);
  }
  if (note) lines.push(`Special instructions: ${note}`);
  lines.push(``, `*Customer details*`);
  lines.push(`Name: ${customer.name || '-'}`);
  lines.push(`Phone: ${customer.phone || '-'}`);
  lines.push(`Address: ${customer.address || '-'}`);
  lines.push(`Payment: ${customer.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid'}`);
  if (orderUtr) lines.push(`UTR: ${orderUtr}`);
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-1.5 falah-gold-btn text-xs px-3.5 py-1.5 rounded-full font-bold"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={14} />
        <span>{LANGUAGES.find((l) => l.code === lang)?.label}</span>
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute right-0 top-full mt-1.5 w-40 bg-[#111111] border border-[#D4AF37]/40 rounded-xl shadow-lg overflow-hidden z-50"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition ${
                  l.code === lang ? 'bg-[#D4AF37]/15 text-[#FFE066]' : 'text-gray-200 hover:bg-[#D4AF37]/10'
                }`}
              >
                {l.label}
                {l.code === lang && <span className="float-right text-[#D4AF37]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const NON_SIZED_CATEGORY = /hijab|attar|perfume|accessor|tasbih|cap|topi|niqab/i;

function ProductGalleryModal({
  product,
  allProducts,
  onSelect,
  onClose,
  onOrder,
  onAddToCart,
  flash,
  bundles,
}: {
  product: any;
  allProducts: any[];
  onSelect: (p: any) => void;
  onClose: () => void;
  onOrder: (p: any, qty: number) => void;
  onAddToCart: (p: any, qty: number) => void;
  flash: FlashSale | null;
  bundles: BundleOffer[];
}) {
  const { t } = useLang();
  const { has: isWished, toggle: toggleWish } = useWishlist();
  const gallery = Array.from(new Set([product.image, ...(product.images ?? [])].filter(Boolean))) as string[];
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closedByBack = useRef(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    pushUiLayer();
    window.history.pushState({ falahProduct: true }, '');
    const onPop = () => {
      closedByBack.current = true;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!closedByBack.current) {
        setSuppressNextPop();
        window.history.back();
      }
      popUiLayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActive(0);
    setQty(1);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  const goTo = (i: number) => {
    if (i === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(i);
      setFading(false);
    }, 150);
  };
  const prev = () => goTo((active - 1 + gallery.length) % gallery.length);
  const next = () => goTo((active + 1) % gallery.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={scrollRef}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gray-100 flex items-center justify-center p-3">
          <div
            className="relative w-full h-72 md:h-96 flex items-center justify-center"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null || gallery.length < 2) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
            }}
          >
            {gallery.length > 0 ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative max-w-full max-h-full flex items-center justify-center cursor-zoom-in"
                aria-label={t('tapToZoom')}
              >
                <img
                  src={gallery[active]}
                  alt={`${product.title} — image ${active + 1}`}
                  className={`max-w-full max-h-72 md:max-h-96 w-auto h-auto object-contain rounded-lg transition-opacity duration-150 ${
                    fading ? 'opacity-0' : 'opacity-100'
                  }`}
                  draggable={false}
                />
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-black/70 text-[#E8D48B] text-[10px] font-semibold px-2 py-1 rounded-full opacity-80 group-hover:opacity-100 transition">
                  <Maximize2 size={11} />
                  {t('tapToZoom')}
                </span>
              </button>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gradient-to-br from-emerald-50 to-gray-100 rounded-lg">
                <ImageOff size={36} />
                <span className="text-xs text-gray-400 mt-2 font-semibold">FALAH</span>
              </div>
            )}

            {gallery.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow transition"
                  aria-label="Previous image"
                >
                  <ChevronDown size={16} className="rotate-90" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow transition"
                  aria-label="Next image"
                >
                  <ChevronDown size={16} className="-rotate-90" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === active ? 'w-5 bg-emerald-700' : 'w-1.5 bg-gray-400/70 hover:bg-gray-500'
                      }`}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow transition"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {gallery.length > 1 && (
          <div className="flex gap-2 px-3 py-2.5 overflow-x-auto bg-white border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
            {gallery.map((img, i) => (
              <button
                key={`${img}-${i}`}
                onClick={() => goTo(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                  i === active ? 'border-emerald-700' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                {t(categoryKey(product.category))}
              </span>
              {product.freeDelivery && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Free Delivery
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-900">₹{product.basePrice}</span>
              {product.regularPrice && (
                <span className="text-xs text-gray-400 line-through">₹{product.regularPrice}</span>
              )}
              <span className="text-[11px] text-gray-500">{t('starting')}</span>
            </div>
          </div>

          <StockUrgency stock={product.stock} outOfStock={product.isOutOfStock} />

          <ProductOffers productId={product.id} category={product.category} flash={flash} bundles={bundles} />

          <TranslatedText text={product.description} fallback={t('defaultDesc')} className="text-sm text-gray-600 leading-relaxed" />

          {product.fabric && (
            <p className="text-xs text-emerald-800 font-semibold">
              {t('fabricLabel')} {product.fabric}
            </p>
          )}

          {product.setIncludes && (
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
              <span className="font-bold text-gray-800 block mb-1">{t('setIncludes')}</span>
              {product.setIncludes.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full"></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {product.fabricVariants && (
            <div className="flex flex-wrap gap-1.5">
              {product.fabricVariants.map((v: any, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200"
                >
                  {v.fabric} - ₹{v.price || v.fullSetPrice}
                </span>
              ))}
            </div>
          )}

          {product.sizeOptions && (
            <div className="flex flex-wrap gap-1.5">
              {product.sizeOptions.map((s: any, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200"
                >
                  {s.size} - ₹{s.price}
                </span>
              ))}
            </div>
          )}

          {!NON_SIZED_CATEGORY.test(product.category ?? '') && (
            <>
              <SizeGuide />
              <SizeRecommender />
            </>
          )}

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <span className="text-sm font-bold text-gray-800">{t('quantity')}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-base font-extrabold text-gray-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700 flex items-center justify-center transition"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {product.isOutOfStock ? (
              <BackInStockNotify productId={product.id} />
            ) : (
              <button
                onClick={() => onOrder(product, qty)}
                className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
              >
                <ShoppingBag size={16} />
                {t('orderNow')}
              </button>
            )}
            <button
              onClick={() => onAddToCart(product, qty)}
              className={`border font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition ${
                product.isOutOfStock
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
              disabled={product.isOutOfStock}
            >
              <Plus size={16} />
              {t('addToCart')}
            </button>
            <button
              onClick={() =>
                toggleWish({
                  productId: product.id,
                  productTitle: product.title,
                  category: product.category,
                  image: product.image || product.images?.[0] || null,
                  basePrice: product.basePrice,
                  addedAt: new Date().toISOString(),
                })
              }
              className={`border p-3 rounded-lg transition ${
                isWished(product.id)
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-rose-300 hover:text-rose-500'
              }`}
              aria-label={t('wishAdd')}
            >
              <Heart size={18} fill={isWished(product.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <DeliveryChecker freeDelivery={product.freeDelivery} />

          <ShareButtons productId={product.id} title={product.title} price={product.basePrice} />

          <ReviewsSection productId={product.id} />

          <ProductSuggestions
            product={product}
            allProducts={allProducts}
            onSelect={onSelect}
            relatedTitle={t('relatedProducts')}
            recentTitle={t('recentlyViewed')}
          />
        </div>
      </div>
      {lightboxOpen && gallery.length > 0 && (
        <ImageLightbox
          images={gallery}
          startIndex={active}
          alt={product.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  const { generateInvoice } = useInvoiceGenerator();
  const { t } = useLang();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null);
  const [customerPoints, setCustomerPoints] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [selectedVariantPrice, setSelectedVariantPrice] = useState<number>(0);
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [customNote, setCustomNote] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [customMeasurements, setCustomMeasurements] = useState({
    length: '',
    chest: '',
    sleeve: '',
  });
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'COD',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const [showPolicies, setShowPolicies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [showReturns, setShowReturns] = useState(false);
  const [reviewStats, setReviewStats] = useState<Record<string, { avg: number; count: number }>>({});
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMyAccount, setShowMyAccount] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [address, setAddress] = useState({ state: '', district: '', policeStation: '', area: '', pincode: '', landmark: '' });
  const [lastOrderCode, setLastOrderCode] = useState('');
  const [designSample, setDesignSample] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoMsg, setPromoMsg] = useState('');
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);
  const { items: cartItems, add: addToCart, clear: clearCart, count: cartCount, subtotal: cartSubtotal } = useCart();
  const { has: isWished, toggle: toggleWish } = useWishlist();
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'single' | 'cart'>('single');
  const [addedPulse, setAddedPulse] = useState(0);
  const [customSel, setCustomSel] = useState<Record<string, number>>({});
  const { flash, bundles } = useStoreOffers();
  const deepLinkHandled = useRef(false);
  useAbandonedCartTracking(cartItems, { name: customer.name, phone: customer.phone });

  useEffect(() => {
    if (deepLinkHandled.current || products.length === 0) return;
    deepLinkHandled.current = true;
    const id = new URLSearchParams(window.location.search).get('product');
    const match = id ? products.find((p) => p.id === id) : null;
    if (match) setDetailProduct(match);
  }, [products]);

  useEffect(() => {
    fetchPromoCodes()
      .then(setPromoCodes)
      .catch(() => setPromoCodes([]));
    loadRewardConfig()
      .then(setRewardConfig)
      .catch(() => setRewardConfig(null));
  }, []);

  useEffect(() => {
    if (!customer.phone || customer.phone.replace(/[^0-9]/g, '').length < 10) {
      setCustomerPoints(0);
      return;
    }
    getCustomerPoints(customer.phone)
      .then((cp) => setCustomerPoints(cp?.points ?? 0))
      .catch(() => setCustomerPoints(0));
  }, [customer.phone]);

  useEffect(() => {
    let alive = true;
    const loadProducts = () =>
      fetchStoreProducts()
        .then((rows) => {
          if (alive) setProducts(rows.length > 0 ? rows : (productsData as any[]));
        })
        .catch(() => {
          if (alive) setProducts((prev) => (prev.length > 0 ? prev : (productsData as any[])));
        })
        .finally(() => {
          if (alive) setProductsLoading(false);
        });
    const loadBanners = () =>
      fetchBanners()
        .then((rows) => alive && setBanners(rows.filter((b) => b.is_active)))
        .catch(() => undefined);
    const loadAnnouncement = () =>
      fetchSetting('announcement_text')
        .then((v) => alive && setAnnouncement(v?.trim() ?? ''))
        .catch(() => undefined);

    loadProducts();
    loadBanners();
    loadAnnouncement();
    const unsubs = [
      subscribeToTable('products', loadProducts),
      subscribeToTable('hero_banners', loadBanners),
      subscribeToTable('site_settings', loadAnnouncement),
    ];
    const onFocus = () => loadProducts();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      unsubs.forEach((u) => u());
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (!detailProduct) return;
    const fresh = products.find((p: any) => p.id === detailProduct.id);
    if (fresh && fresh !== detailProduct) setDetailProduct(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  useEffect(() => {
    fetchBestSellers()
      .then(setBestSellerIds)
      .catch(() => setBestSellerIds([]));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('product_reviews')
          .select('product_id, rating');
        if (error || !data) return;
        const stats: Record<string, { sum: number; count: number }> = {};
        for (const row of data as { product_id: string; rating: number }[]) {
          if (!stats[row.product_id]) stats[row.product_id] = { sum: 0, count: 0 };
          stats[row.product_id].sum += row.rating;
          stats[row.product_id].count += 1;
        }
        const out: Record<string, { avg: number; count: number }> = {};
        for (const [pid, s] of Object.entries(stats)) {
          out[pid] = { avg: s.sum / s.count, count: s.count };
        }
        setReviewStats(out);
      } catch {
        // reviews sorting is optional; skip on failure
      }
    })();
  }, []);

  const bestSellerId = (() => {
    let best: string | null = null;
    let bestScore = 0;
    for (const p of products) {
      const s = reviewStats[p.id];
      if (!s || s.count === 0) continue;
      const score = s.avg * s.count;
      if (score > bestScore) {
        bestScore = score;
        best = p.id;
      }
    }
    return best;
  })();

  const isBestSeller = (productId: string) =>
    bestSellerIds.includes(productId) || productId === bestSellerId;

  const filteredProducts = products.filter((p: any) => {
    if (activeCategory === 'bestseller') {
      if (!isBestSeller(p.id)) return false;
    } else if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.fabric?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    const sa = reviewStats[a.id];
    const sb = reviewStats[b.id];
    // products with reviews first: more reviews + higher rating rank higher
    const scoreA = (sa?.count ?? 0) > 0 ? sa.avg + Math.min(sa.count, 10) * 0.1 : -1;
    const scoreB = (sb?.count ?? 0) > 0 ? sb.avg + Math.min(sb.count, 10) * 0.1 : -1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (a.basePrice ?? 0) - (b.basePrice ?? 0);
  });

  const handleOpenCheckout = (product: any, qty: number = 1) => {
    setSelectedProduct(product);
    setOrderSuccess(false);
    setQuantity(Math.max(1, qty));
    setRedeemPoints(0);
    setCustomSel(defaultSelection(product));
    setCustomNote('');
    setSelectedColor(product.readyColors?.[0] || product.colors?.[0] || product.color || '');
    if (product.fabricVariants && product.fabricVariants.length > 0) {
      setSelectedVariantPrice(
        product.fabricVariants[0].price || product.fabricVariants[0].fullSetPrice || product.basePrice
      );
      setSelectedVariantName(product.fabricVariants[0].fabric);
    } else if (product.sizeOptions && product.sizeOptions.length > 0) {
      setSelectedVariantPrice(product.sizeOptions[0].price);
      setSelectedVariantName(product.sizeOptions[0].size);
    } else {
      setSelectedVariantPrice(product.basePrice);
      setSelectedVariantName(product.fabric || 'Standard');
    }
  };

  const handleCloseCheckout = () => {
    setSelectedProduct(null);
    setOrderSuccess(false);
    setPaymentUtr('');
    setPaymentScreenshot(null);
    setDesignSample(null);
    setPromoInput('');
    setAppliedPromo(null);
    setPromoMsg('');
    setCustomNote('');
    setSelectedColor('');
    setAddress({ state: '', district: '', policeStation: '', area: '', pincode: '', landmark: '' });
    setQuantity(1);
    setRedeemPoints(0);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !address.state || !address.district || !address.policeStation || !address.area || !/^[1-9][0-9]{5}$/.test(address.pincode)) {
      alert(t('alertFill'));
      return;
    }
    const isPrepaid = customer.paymentMethod === 'Prepaid';
    if (isPrepaid && !paymentUtr.trim()) {
      alert(t('payUtr'));
      return;
    }
    setLoading(true);
    try {
      const orderCode = `ORD-${Date.now()}`;
      const isCartOrder = checkoutMode === 'cart' && cartItems.length > 0;
      const orderTitle = isCartOrder
        ? cartItems
            .map((i) => `${i.productTitle} (${i.variantName}${i.size ? ` • ${i.size}` : ''}) x${i.qty}`)
            .join(' + ')
        : selectedProduct.title;
      const giftItems = offers.gifts.map((g) => ({ title: `FREE: ${g}`, variant: 'Combo Offer', size: '', qty: 1, price: 0, note: '' }));
      const fullTitle = [orderTitle, ...giftItems.map((g) => g.title)].join(' + ');
      const orderItems = isCartOrder
        ? [
            ...cartItems.map((i) => ({ title: i.productTitle, variant: i.variantName, size: i.size, qty: i.qty, price: i.basePrice, note: i.note })),
            ...giftItems,
          ]
        : [{ title: selectedProduct.title, variant: fullVariant, size: selectedSize, qty: quantity, price: selectedVariantPrice + optionsDelta, note: '' }, ...giftItems];
      const fullAddress = [
        address.landmark,
        address.area,
        address.policeStation,
        address.district,
        address.state,
        `PIN ${address.pincode}`,
      ].filter(Boolean).join(', ');
      const orderCustomer = { ...customer, address: fullAddress };
      const order: OrderRecord = {
        id: orderCode,
        productId: selectedProduct.id,
        productTitle: fullTitle,
        variantChosen: fullVariant,
        sizeChosen: selectedSize,
        customMeasurements,
        customNote,
        totalAmount: grandTotal,
        customer: orderCustomer,
        paymentUtr: isPrepaid ? paymentUtr.trim() : '',
        paymentScreenshot: isPrepaid ? paymentScreenshot : null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      saveOrder(order);
      await saveOrderToDb({
        orderCode,
        productId: selectedProduct.id,
        productTitle: fullTitle,
        variantChosen: fullVariant,
        sizeChosen: selectedSize,
        customMeasurements,
        customNote: checkoutMode === 'single' ? customNote : '',
        totalAmount: grandTotal,
        shippingCharge: shippingCharge,
        serviceCharge,
        customer: orderCustomer,
        paymentUtr: isPrepaid ? paymentUtr.trim() : '',
        paymentScreenshot: isPrepaid ? paymentScreenshot : null,
        designSample: designSample ?? null,
        discountAmount: totalDiscount,
        promoCode: appliedPromo?.code ?? null,
        orderItems,
        giftWrap,
        giftNote,
      });
      if (rewardConfig?.enabled) {
        addRewardPoints(customer.phone, productSubtotal).catch(() => undefined);
      }
      setLastOrderCode(orderCode);
      if (checkoutMode === 'cart') {
        clearCartAfterOrder();
        markCartRecovered();
      }
      setLastInvoice({
        orderCode,
        createdAt: order.createdAt,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: fullAddress,
        items: (isCartOrder
          ? cartItems.map((i) => ({
              title: i.productTitle,
              detail: [i.variantName, i.size, i.note].filter(Boolean).join(' • '),
              qty: i.qty,
              unitPrice: i.basePrice,
            }))
          : [{ title: selectedProduct.title, detail: [fullVariant, selectedSize].filter(Boolean).join(' • '), qty: quantity, unitPrice: selectedVariantPrice + optionsDelta }]
        ).concat(offers.gifts.map((g) => ({ title: `FREE: ${g}`, detail: 'Combo Offer', qty: 1, unitPrice: 0 }))),
        subtotal: productSubtotal,
        extraCharges: [{ label: 'COD Charge', amount: codExtra }],
        shippingCharge,
        serviceCharge,
        discount: totalDiscount,
        total: grandTotal,
        paymentMethod: isPrepaid ? 'Prepaid (PhonePe/GPay/Bank)' : 'Cash on Delivery',
      });
      setOrderSuccess(true);
    } catch {
      alert(t('alertFill'));
    } finally {
      setLoading(false);
    }
  };

  function saveOrder(order: OrderRecord) {
    let all: OrderRecord[] = [];
    try {
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      all = raw ? (JSON.parse(raw) as OrderRecord[]) : [];
    } catch {
      all = [];
    }
    all.unshift(order);
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  const codExtra = customer.paymentMethod === 'COD' ? 50 : 0;
  const optionsDelta = checkoutMode === 'single' ? optionsTotal(selectedProduct, customSel) : 0;
  const shippingCharge = address.state ? getShippingCharge(address.state) : 0;
  const unitPrice = selectedVariantPrice + optionsDelta;
  const productSubtotal = unitPrice * (checkoutMode === 'single' ? quantity : 1);
  const discount = appliedPromo
    ? appliedPromo.type === 'percent'
      ? Math.round((productSubtotal * appliedPromo.value) / 100)
      : Math.min(appliedPromo.value, productSubtotal)
    : 0;
  const offers = computeOffers(
    checkoutMode === 'cart' && cartItems.length > 0
      ? cartItems.map((i) => ({ productId: i.productId, category: i.category, unitPrice: i.basePrice, qty: i.qty }))
      : selectedProduct
        ? [{ productId: selectedProduct.id, category: selectedProduct.category ?? '', unitPrice: unitPrice, qty: checkoutMode === 'single' ? quantity : 1 }]
        : [],
    flash,
    bundles
  );
  const earnedPoints = rewardConfig?.enabled && productSubtotal > 0 ? calculateEarnedPoints(productSubtotal, rewardConfig) : 0;
  const canRedeem = rewardConfig?.enabled && productSubtotal >= (rewardConfig.minCartTotalToRedeem ?? 0);
  const maxRedeem = canRedeem ? maxRedeemablePoints(customerPoints, productSubtotal, rewardConfig) : 0;
  const pointsDiscount = Math.min(redeemPoints, maxRedeem) * (rewardConfig?.pointValueInRs ?? 0);
  const totalDiscount = Math.min(productSubtotal, discount + offers.total + pointsDiscount);
  const serviceCharge = getServiceCharge(productSubtotal);
  const grandTotal = Math.max(0, productSubtotal + codExtra + shippingCharge + serviceCharge - totalDiscount);
  const optsLabel = checkoutMode === 'single' ? optionsLabel(selectedProduct, customSel) : '';
  const colorOptions: string[] =
    selectedProduct?.readyColors ?? selectedProduct?.colors ?? (selectedProduct?.color ? [selectedProduct.color] : []);
  const fullVariant = [selectedColor, selectedVariantName, optsLabel].filter(Boolean).join(' • ');

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const found = promoCodes.find((c) => c.code.toUpperCase() === code && c.active);
    if (found) {
      setAppliedPromo(found);
      setPromoMsg(t('promoApplied'));
    } else {
      setAppliedPromo(null);
      setPromoMsg(t('promoInvalid'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="bg-[#111111] text-[#E8D48B] text-xs text-center py-2.5 px-4 font-medium flex justify-center items-center gap-2 border-b border-[#D4AF37]/20">
        <Truck size={14} className="text-[#D4AF37]" />
        <span>{announcement || t('announce')}</span>
      </div>

      <header className="bg-[#0d0d0d] border-b border-[#D4AF37]/30 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-6">
          <div className="flex justify-between items-center gap-4 md:gap-8">
            <div className="min-w-0 md:mr-6">
              <div className="falah-logo inline-flex flex-col px-1">
                <h1 className="text-2xl font-serif font-black tracking-wider falah-gold-text leading-none">FALAH</h1>
                <p className="text-[10px] tracking-widest uppercase font-semibold falah-gold-sub mt-1">
                  Premium Online Store
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => setShowWishlist(true)}
                className="relative falah-gold-icon-btn p-2 rounded-full font-bold"
                aria-label={t('wishTitle')}
              >
                <Heart size={16} />
              </button>
              <button
                onClick={() => setShowCart(true)}
                className={`relative falah-gold-icon-btn p-2 rounded-full font-bold ${
                  addedPulse > 0 ? 'animate-bounce' : ''
                }`}
                aria-label={t('cartTitle')}
                key={addedPulse}
              >
                <ShoppingCart size={16} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#0d0d0d] text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={() => setShowTracking(true)}
              className="flex items-center gap-1.5 falah-gold-btn text-xs px-3.5 py-1.5 rounded-full font-bold"
            >
              <PackageSearch size={13} />
              <span>{t('trackBtn')}</span>
            </button>
            <button
              onClick={() => setShowMyAccount(true)}
              className="flex items-center gap-1.5 falah-gold-btn text-xs px-3.5 py-1.5 rounded-full font-bold"
            >
              <User size={13} />
              <span>My Account</span>
            </button>
            <LanguageSwitcher />
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 falah-gold-btn text-xs px-3.5 py-1.5 rounded-full font-bold"
            >
              <PhoneCall size={13} />
              <span>{t('support')}</span>
            </a>
          </div>
        </div>
      </header>

      {banners.length > 0 ? (
        <HeroSlider banners={banners} ctaLabel={t('shopNow')} />
      ) : (
      <section className="bg-gradient-to-b from-emerald-900 to-emerald-950 text-white py-14 px-4 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1 bg-emerald-800/60 border border-emerald-700/50 text-emerald-200 text-xs px-3 py-1 rounded-full font-medium">
            <Sparkles size={12} className="text-amber-300" />
            {t('heroBadge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">{t('heroTitle')}</h2>
          <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed max-w-xl mx-auto">{t('heroSub')}</p>
        </div>
      </section>
      )}

      <section className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center text-xs">
          <div className="p-2 space-y-1">
            <ShieldCheck size={20} className="text-emerald-800 mx-auto" />
            <span className="font-bold block text-gray-800">{t('feat1t')}</span>
            <span className="text-[11px] text-gray-500">{t('feat1s')}</span>
          </div>
          <div className="p-2 space-y-1">
            <RefreshCw size={20} className="text-emerald-800 mx-auto" />
            <span className="font-bold block text-gray-800">{t('feat2t')}</span>
            <span className="text-[11px] text-gray-500">{t('feat2s')}</span>
          </div>
          <div className="p-2 space-y-1">
            <Truck size={20} className="text-emerald-800 mx-auto" />
            <span className="font-bold block text-gray-800">{t('feat3t')}</span>
            <span className="text-[11px] text-gray-500">{t('feat3s')}</span>
          </div>
          <div className="p-2 space-y-1">
            <ShoppingBag size={20} className="text-emerald-800 mx-auto" />
            <span className="font-bold block text-gray-800">{t('feat4t')}</span>
            <span className="text-[11px] text-gray-500">{t('feat4s')}</span>
          </div>
        </div>
      </section>

      {isFlashLive(flash) && <FlashSaleBanner sale={flash} />}

      <section className="bg-white border-b border-gray-100 sticky top-[112px] md:top-[72px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <VoiceImageSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveCategory('bestseller')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition whitespace-nowrap shadow-sm ${
                activeCategory === 'bestseller'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600'
                  : 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-300 hover:border-amber-500'
              }`}
            >
              <Award size={13} />
              {t('bestSeller')}
            </button>
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
              }`
            }
            >
              <LayoutGrid size={13} />
              {t('catAll')}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                }`
              }
              >
                {t(categoryKey(cat))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">{t('colTitle')}</h2>
            <p className="text-xs text-gray-500 mt-1">{t('colSub')}</p>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full mt-2 md:mt-0">
            {t('totalItems', { n: products.length })}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {productsLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`sk-${i}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          {sortedProducts.map((product: any) => (
            <div
              key={product.id}
              onClick={() => setDetailProduct(product)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-emerald-300 transition group"
            >
              <div className="relative h-48 md:h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
                {product.image || (product.images && product.images.length > 0) ? (
                  <img
                    src={product.image || product.images[0]}
                    alt={product.title}
                    className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gradient-to-br from-emerald-50 to-gray-100">
                    <ImageOff size={28} />
                    <span className="text-[10px] text-gray-400 mt-1.5 font-semibold">FALAH</span>
                  </div>
                )}
                {isBestSeller(product.id) && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ring-1 ring-yellow-300/60">
                    <Award size={10} /> {t('bestSeller')}
                  </span>
                )}
                {product.isOutOfStock && (
                  <span className={`absolute right-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow ${
                    isBestSeller(product.id) ? 'top-8' : 'top-2'
                  }`}>
                    <CircleAlert size={10} /> {t('oosBadge')}
                  </span>
                )}
                {reviewStats[product.id] && (
                  <span className="absolute bottom-2 left-2 bg-white/90 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                    <Star size={9} className="text-amber-500" fill="currentColor" /> {reviewStats[product.id].avg.toFixed(1)}
                  </span>
                )}
                {product.images && product.images.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    {product.images.length + 1} 📷
                  </span>
                )}
                {product.freeDelivery && (
                  <span className="absolute top-2 left-2 text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Free Delivery
                  </span>
                )}
              </div>
              <div className="p-3 md:p-4 flex-1 flex flex-col">
                <span className="text-[9px] md:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase self-start">
                  {t(categoryKey(product.category))}
                </span>
                <h3 className="text-xs md:text-base font-bold text-gray-900 mt-1.5 line-clamp-2">{product.title}</h3>
                {product.fabric && (
                  <p className="text-[10px] md:text-[11px] text-emerald-800 font-semibold mt-1 truncate">
                    {t('fabricLabel')} {product.fabric}
                  </p>
                )}
                <div className="mt-2 md:mt-3 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base md:text-xl font-extrabold text-emerald-900">₹{product.basePrice}</span>
                  {product.regularPrice && (
                    <span className="text-[10px] text-gray-400 line-through">₹{product.regularPrice}</span>
                  )}
                  <span className="text-[9px] md:text-[11px] text-gray-500">{t('starting')}</span>
                </div>
              </div>
              <div className="px-3 pb-3 md:px-4 md:pb-4">
                {product.isOutOfStock ? (
                  <BackInStockNotify productId={product.id} />
                ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCheckout(product);
                      setCheckoutMode('single');
                    }}
                    className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg text-[11px] md:text-sm flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <ShoppingBag size={13} className="md:hidden" />
                    <ShoppingBag size={15} className="hidden md:block" />
                    {t('orderNow')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCheckout(product);
                      setCheckoutMode('single');
                    }}
                    className="bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 p-2 rounded-lg transition"
                    aria-label={t('addToCart')}
                    title={t('addToCart')}
                  >
                    <Plus size={15} className="md:w-4 md:h-4" />
                  </button>
                </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWish({
                      productId: product.id,
                      productTitle: product.title,
                      category: product.category,
                      image: product.image || product.images?.[0] || null,
                      basePrice: product.basePrice,
                      addedAt: new Date().toISOString(),
                    });
                  }}
                  className={`mt-1.5 w-full text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition border ${
                    isWished(product.id)
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-500'
                  }`}
                  aria-label={t('wishAdd')}
                >
                  <Heart size={12} fill={isWished(product.id) ? 'currentColor' : 'none'} /> {isWished(product.id) ? t('wishSaved') : t('wishAdd')}
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <Search size={32} className="mx-auto mb-3 text-gray-300" />
            {t('noResults')}
          </div>
        )}
      </main>

      <InstagramFeed fallbackImages={products.map((p) => p.image || p.images?.[0]).filter(Boolean).slice(0, 8)} />

      <footer className="bg-emerald-950 text-emerald-100 py-10 px-4 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="falah-logo-badge rounded-lg px-3 py-1.5 inline-block">
              <h3 className="font-serif font-bold text-lg tracking-wider falah-gold-text leading-none">FALAH</h3>
            </div>
            <p className="text-xs text-emerald-200 mt-2 leading-relaxed">{t('footerAbout')}</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">{t('footerContact')}</h4>
            <p className="text-xs text-emerald-200">{t('footerWhatsApp')}</p>
            <p className="text-xs text-emerald-200 mt-1">{t('footerLocation')}</p>
            <button
              onClick={() => setShowPolicies(true)}
              className="text-xs text-emerald-200 hover:text-white underline decoration-emerald-700 underline-offset-2 mt-3 block transition"
            >
              {t('policiesTitle')}
            </button>
            <button
              onClick={() => setShowTracking(true)}
              className="text-xs text-emerald-200 hover:text-white underline decoration-emerald-700 underline-offset-2 mt-1.5 flex items-center gap-1 transition"
            >
              <PackageSearch size={11} /> {t('trackBtn')}
            </button>
            <button
              onClick={() => setShowReturns(true)}
              className="text-xs text-emerald-200 hover:text-white underline decoration-emerald-700 underline-offset-2 mt-1.5 flex items-center gap-1 transition"
            >
              <RefreshCcw size={11} /> {t('returnsBtn')}
            </button>
            <a href="/admin" className="text-[11px] text-emerald-400 hover:text-emerald-200 mt-2 inline-block">
              {t('adminLink')}
            </a>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">{t('footerBenefits')}</h4>
            <ul className="text-xs text-emerald-200 space-y-1">
              <li>{t('ben1')}</li>
              <li>{t('ben2')}</li>
              <li>{t('ben3')}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-emerald-800 text-center text-[11px] text-emerald-300">
          © {new Date().getFullYear()} FALAH • Premium Online Store • Kolkata
        </div>
      </footer>

      {showPolicies && <PolicyModal onClose={() => setShowPolicies(false)} />}

      {detailProduct && <ProductGalleryModal product={detailProduct} allProducts={products} onSelect={setDetailProduct} onClose={() => setDetailProduct(null)} flash={flash} bundles={bundles} onOrder={(p, qty) => { handleOpenCheckout(p, qty); setCheckoutMode('single'); }} onAddToCart={(p, qty) => {
        if (p.isOutOfStock) return;
        setDetailProduct(null);
        handleOpenCheckout(p, qty);
        setCheckoutMode('single');
      }} />}

      {showReturns && <ReturnRequestModal onClose={() => setShowReturns(false)} />}

      {showTracking && <TrackOrderModal onClose={() => setShowTracking(false)} />}
      {showMyAccount && <MyAccountModal onClose={() => setShowMyAccount(false)} />}
      {showLogin && <CustomerLoginModal onClose={() => setShowLogin(false)} />}

      <CartDrawer
        open={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false);
          setCheckoutMode('cart');
          setSelectedProduct({
            id: 'CART',
            title: t('cartTitle'),
            category: 'Cart',
            basePrice: cartSubtotal,
          });
          setSelectedVariantPrice(cartSubtotal);
          setSelectedVariantName(`${cartCount} ${t('cartItemsSuffix')}`);
          setSelectedColor('');
          setCustomNote('');
          setOrderSuccess(false);
        }}
      />

      <WishlistModal
        open={showWishlist}
        onClose={() => setShowWishlist(false)}
        onOrder={(productId) => {
          const product = products.find((p: any) => p.id === productId);
          if (product) {
            handleOpenCheckout(product);
            setCheckoutMode('single');
          }
        }}
      />

      <FloatingWidgets catalog={products} />
      <PushNotificationPrompt />

      <AbandonedCartReminder
        items={cartItems}
        suppressed={showCart || Boolean(selectedProduct) || Boolean(detailProduct)}
        onOpenCart={() => setShowCart(true)}
      />

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {!orderSuccess ? (
              <form onSubmit={handleOrderSubmit}>
                <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedProduct.title}</h3>
                    <p className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wide">
                      {t(categoryKey(selectedProduct.category))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseCheckout}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {colorOptions.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                        <Tag size={14} className="text-emerald-800" /> {t('ckColor')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((c) => {
                          const active = selectedColor === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSelectedColor(active ? '' : c)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold transition ${
                                active
                                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300 inline-block flex-shrink-0"
                                style={{ backgroundColor: COLOR_HEX[c] ?? '#e5e7eb' }}
                              />
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedProduct.fabricVariants && selectedProduct.fabricVariants.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                        <Tag size={14} className="text-emerald-800" /> {t('ckFabric')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.fabricVariants.map((v: any, idx: number) => {
                          const price = v.price || v.fullSetPrice || selectedProduct.basePrice;
                          const name = v.fabric;
                          const active = selectedVariantName === name;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedVariantName(name);
                                setSelectedVariantPrice(price);
                              }}
                              className={`text-left p-2.5 rounded-lg border text-xs transition ${
                                active
                                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                              }`}
                            >
                              <span className="block">{name}</span>
                              <span className="text-emerald-800 font-extrabold">₹{price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedProduct.sizeOptions && selectedProduct.sizeOptions.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                        <Tag size={14} className="text-emerald-800" /> {t('ckSize')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.sizeOptions.map((s: any, idx: number) => {
                          const active = selectedVariantName === s.size;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedVariantName(s.size);
                                setSelectedVariantPrice(s.price);
                              }}
                              className={`text-left p-2.5 rounded-lg border text-xs transition ${
                                active
                                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                              }`}
                            >
                              <span className="block">{s.size}</span>
                              <span className="text-emerald-800 font-extrabold">₹{s.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!selectedProduct.fabricVariants &&
                    !selectedProduct.sizeOptions &&
                    selectedProduct.priceVariants && (
                      <div>
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                          <Tag size={14} className="text-emerald-800" /> {t('ckPriceVariant')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedProduct.priceVariants.map((p: number, idx: number) => {
                            const active = selectedVariantPrice === p;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedVariantPrice(p);
                                  setSelectedVariantName(`Variant ₹${p}`);
                                }}
                                className={`p-2.5 rounded-lg border text-xs transition ${
                                  active
                                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                                }`}
                              >
                                ₹{p}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {getCustomGroups(selectedProduct).length > 0 && (
                    <div className="space-y-4">
                      {getCustomGroups(selectedProduct).map((group) => (
                        <div key={group.name}>
                          <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                            <Tag size={14} className="text-emerald-800" /> {group.name}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((opt, optIdx) => {
                              const active = (customSel[group.name] ?? 0) === optIdx;
                              const delta =
                                typeof opt.priceDelta === 'number' && opt.priceDelta !== 0
                                  ? `${opt.priceDelta > 0 ? '+' : ''}₹${opt.priceDelta}`
                                  : null;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => setCustomSel({ ...customSel, [group.name]: optIdx })}
                                  className={`px-3.5 py-2 rounded-lg border text-xs font-bold transition ${
                                    active
                                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                                  }`}
                                >
                                  {opt.label}
                                  {delta && <span className="ml-1.5 text-emerald-800">{delta}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedProduct.customizable && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                        <Ruler size={14} className="text-amber-700" /> {t('ckMeasurements')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder={t('ckLength')}
                          value={customMeasurements.length}
                          onChange={(e) => setCustomMeasurements({ ...customMeasurements, length: e.target.value })}
                          className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
                        />
                        <input
                          type="text"
                          placeholder={t('ckChest')}
                          value={customMeasurements.chest}
                          onChange={(e) => setCustomMeasurements({ ...customMeasurements, chest: e.target.value })}
                          className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
                        />
                        <input
                          type="text"
                          placeholder={t('ckSleeve')}
                          value={customMeasurements.sleeve}
                          onChange={(e) => setCustomMeasurements({ ...customMeasurements, sleeve: e.target.value })}
                          className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                          <Upload size={13} /> {t('designUpload')}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-1.5">{t('designUploadHint')}</p>
                        {designSample ? (
                          <div className="relative rounded-lg overflow-hidden border border-amber-300 bg-white">
                            <img src={designSample} alt="Design sample" className="w-full h-28 object-contain bg-gray-50" />
                            <button
                              type="button"
                              onClick={() => setDesignSample(null)}
                              className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1 shadow"
                              aria-label={t('designRemove')}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) return;
                              try {
                                const url = await uploadDesignSample(file).catch(() => fileToUrl(file));
                                setDesignSample(url);
                              } catch {
                                // optional upload, ignore failure
                              }
                            }}
                            className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-900 file:font-bold file:text-xs file:cursor-pointer cursor-pointer bg-white border border-amber-300 rounded-md"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                      <Tag size={14} className="text-emerald-800" /> {t('ckNote')}
                    </label>
                    <textarea
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      rows={2}
                      placeholder={t('ckNotePlaceholder')}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 resize-none"
                    />
                  </div>

                  <GiftWrapSection giftWrap={giftWrap} setGiftWrap={setGiftWrap} giftNote={giftNote} setGiftNote={setGiftNote} />

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <h4 className="text-sm font-bold text-gray-800">{t('ckDeliveryInfo')}</h4>
                    <input
                      type="text"
                      placeholder={t('ckName')}
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
                      required
                    />
                    <input
                      type="tel"
                      placeholder={t('ckPhone')}
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
                      required
                    />
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ state: e.target.value, district: '', policeStation: '', area: '', pincode: '', landmark: '' })}
                      className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                      required
                    >
                      <option value="">{t('ckState')}</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    {address.state && (
                      <select
                        value={address.district}
                        onChange={(e) => setAddress({ ...address, district: e.target.value, policeStation: '', area: '' })}
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                        required
                      >
                        <option value="">{t('ckDistrict')}</option>
                        {getDistrictsForState(address.state).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    )}
                    {address.district && (
                      <select
                        value={address.policeStation}
                        onChange={(e) => setAddress({ ...address, policeStation: e.target.value, area: '' })}
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                        required
                      >
                        <option value="">{t('ckPoliceStation')}</option>
                        {getPoliceStationsForDistrict(address.state, address.district).map((ps) => (
                          <option key={ps} value={ps}>{ps}</option>
                        ))}
                      </select>
                    )}
                    {address.policeStation && (
                      <select
                        value={address.area}
                        onChange={(e) => setAddress({ ...address, area: e.target.value })}
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                        required
                      >
                        <option value="">{t('ckArea')}</option>
                        {getAreasForPoliceStation(address.state, address.policeStation).map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    )}
                    {address.area && (
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={t('ckPincode')}
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
                        required
                      />
                    )}
                    {address.area && (
                      <input
                        type="text"
                        placeholder={t('ckLandmark')}
                        value={address.landmark}
                        onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
                      />
                    )}

                    <div>
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                        <CreditCard size={14} className="text-emerald-800" /> {t('ckPayment')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomer({ ...customer, paymentMethod: 'COD' })}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-bold transition ${
                            customer.paymentMethod === 'COD'
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                          }`}
                        >
                          <Banknote size={14} /> {t('cod')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomer({ ...customer, paymentMethod: 'Prepaid' })}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-bold transition ${
                            customer.paymentMethod === 'Prepaid'
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                          }`}
                        >
                          <CreditCard size={14} /> {t('prepaid')}
                        </button>
                      </div>
                    </div>

                    {customer.paymentMethod === 'Prepaid' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                        <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <CreditCard size={14} /> {t('payTitle')}
                        </h5>
                        <p className="text-[11px] text-amber-800">{t('payNote')}</p>

                        <div className="bg-white rounded-lg border border-amber-200 p-3 space-y-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(PAYMENT_DETAILS.upiNumber);
                            }}
                            className="flex justify-between items-center w-full gap-2 group"
                          >
                            <span className="text-gray-500">{t('payUpiLabel')}</span>
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              {PAYMENT_DETAILS.upiNumber}
                              <Copy size={12} className="text-gray-400 group-hover:text-emerald-700" />
                            </span>
                          </button>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('payBank')}</span>
                            <span className="font-bold text-gray-800">{PAYMENT_DETAILS.bankName}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('payHolder')}</span>
                            <span className="font-bold text-gray-800">{PAYMENT_DETAILS.accountHolder}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(PAYMENT_DETAILS.accountNumber);
                            }}
                            className="flex justify-between items-center w-full gap-2 group"
                          >
                            <span className="text-gray-500">{t('payAccount')}</span>
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              {PAYMENT_DETAILS.accountNumber}
                              <Copy size={12} className="text-gray-400 group-hover:text-emerald-700" />
                            </span>
                          </button>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('payIfsc')}</span>
                            <span className="font-bold text-gray-800">{PAYMENT_DETAILS.ifsc}</span>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder={t('payUtr')}
                          value={paymentUtr}
                          onChange={(e) => setPaymentUtr(e.target.value)}
                          className="w-full border border-amber-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                        />

                        <label className="block">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                            <Upload size={13} /> {t('payScreenshot')}
                          </span>
                          {paymentScreenshot ? (
                            <div className="relative rounded-lg overflow-hidden border border-amber-300 bg-white">
                              <img src={paymentScreenshot} alt="Payment screenshot" className="w-full h-32 object-cover" />
                              <button
                                type="button"
                                onClick={() => setPaymentScreenshot(null)}
                                className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1 shadow"
                                aria-label="Remove screenshot"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const url = await fileToUrl(file);
                                  setPaymentScreenshot(url);
                                } catch {
                                  // ignore
                                }
                              }}
                              className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-900 file:font-bold file:text-xs file:cursor-pointer cursor-pointer bg-white border border-amber-300 rounded-md"
                            />
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="text-xs text-gray-600 space-y-1">
                      {checkoutMode === 'cart' && cartItems.length > 0 ? (
                        <div className="space-y-1 pb-1.5 border-b border-emerald-200/70">
                          {cartItems.map((i) => (
                            <div key={`${i.productId}-${i.variantName}-${i.size}`} className="flex justify-between gap-3">
                              <span className="min-w-0 truncate">
                                <span className="font-semibold text-gray-800">{i.productTitle}</span>{' '}
                                <span className="text-gray-500">({[i.variantName, i.size].filter(Boolean).join(' • ')}) x{i.qty}</span>
                              </span>
                              <span className="font-semibold text-gray-800 shrink-0">₹{i.basePrice * i.qty}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span>
                            {t('successVariant')} <span className="font-bold text-gray-800">{selectedVariantName}</span>
                            <span className="text-gray-500"> x{quantity}</span>
                          </span>
                          <span className="font-semibold text-gray-800">₹{unitPrice * quantity}</span>
                        </div>
                      )}
                      {customNote && (
                        <div className="text-[11px] text-gray-600">
                          <span className="font-bold text-gray-800">{t('ckNote')}:</span>{' '}
                          <span className="italic">{customNote}</span>
                        </div>
                      )}
                      {optionsDelta !== 0 && (
                        <div className="flex justify-between">
                          <span>{optionsLabel(selectedProduct, customSel)}</span>
                          <span className={optionsDelta > 0 ? 'font-semibold text-gray-800' : 'font-semibold text-emerald-700'}>
                            {optionsDelta > 0 ? '+' : '-'} ₹{Math.abs(optionsDelta)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-gray-800">
                        <span>{t('subtotal')}</span>
                        <span>₹{productSubtotal}</span>
                      </div>
                      {codExtra > 0 && (
                        <div className="flex justify-between">
                          <span>{t('codCharge')}</span>
                          <span>₹{codExtra}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>
                          {t('shipCharge')} {address.state && <span className="text-[10px] text-gray-400">({address.state === 'West Bengal' ? t('shipWB') : t('shipOutside')})</span>}
                        </span>
                        <span>{shippingCharge > 0 ? `₹${shippingCharge}` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {t('serviceCharge')} <span className="text-[10px] text-gray-400">{serviceChargeLabel}</span>
                        </span>
                        <span>₹{serviceCharge}</span>
                      </div>
                      {offers.lines.map((l) => (
                        <div key={l.label} className="flex justify-between text-rose-700 font-bold">
                          <span>{l.label}</span>
                          <span>- ₹{l.amount}</span>
                        </div>
                      ))}
                      {offers.gifts.map((g) => (
                        <div key={g} className="flex justify-between text-amber-800 font-bold">
                          <span>{t('freeGift')}: {g}</span>
                          <span>₹0</span>
                        </div>
                      ))}
                      {appliedPromo && discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>{t('discount')} ({appliedPromo.code})</span>
                          <span>- ₹{discount}</span>
                        </div>
                      )}
                      {rewardConfig?.enabled && earnedPoints > 0 && (
                        <div className="flex justify-between text-amber-800 font-bold">
                          <span>You will earn</span>
                          <span>{earnedPoints} pts</span>
                        </div>
                      )}
                      {rewardConfig?.enabled && customerPoints > 0 && (
                        <div className="pt-2 border-t border-emerald-200/70 space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Award size={12} /> Reward Points
                          </label>
                          {canRedeem ? (
                            <>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={maxRedeem}
                                  value={redeemPoints || ''}
                                  onChange={(e) => setRedeemPoints(Math.max(0, Math.min(maxRedeem, Number(e.target.value) || 0)))}
                                  className="flex-1 min-w-0 border border-emerald-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                                  placeholder={`Redeem up to ${maxRedeem} pts`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setRedeemPoints(maxRedeem)}
                                  className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-3 rounded-md transition flex-shrink-0"
                                >
                                  Max
                                </button>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                You have {customerPoints} pts worth ₹{pointsToRupees(maxRedeem, rewardConfig)} off
                              </p>
                              {pointsDiscount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-bold">
                                  <span>Points discount</span>
                                  <span>- ₹{pointsDiscount}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-[11px] text-gray-500">
                              Min cart total ₹{rewardConfig.minCartTotalToRedeem} to redeem points
                            </p>
                          )}
                        </div>
                      )}
                      <div className="border-t border-emerald-200 pt-1.5 flex justify-between items-center">
                        <span className="font-bold text-gray-800">{t('totalPayable')}</span>
                        <span className="text-2xl font-extrabold text-emerald-900">₹{grandTotal}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                        <Tag size={12} /> {t('promoTitle')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder={t('promoPlaceholder')}
                          className="flex-1 min-w-0 border border-emerald-200 rounded-md px-3 py-2 text-xs uppercase focus:outline-none focus:border-emerald-600 bg-white"
                        />
                        <button
                          type="button"
                          onClick={applyPromo}
                          className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-4 rounded-md transition flex-shrink-0"
                        >
                          {t('promoApply')}
                        </button>
                      </div>
                      {promoMsg && (
                        <p className={`text-[11px] font-bold mt-1.5 ${appliedPromo ? 'text-emerald-700' : 'text-red-600'}`}>{promoMsg}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {checkoutMode === 'single' && (
                      <button
                        type="button"
                        onClick={() => {
                          addToCart({
                            productId: selectedProduct.id,
                            productTitle: selectedProduct.title,
                            category: selectedProduct.category,
                            image: selectedProduct.image || selectedProduct.images?.[0] || null,
                            variantName: fullVariant || selectedVariantName,
                            size: selectedSize,
                            note: customNote,
                            basePrice: selectedVariantPrice + optionsDelta,
                            qty: quantity,
                          });
                          setAddedPulse((n) => n + 1);
                          handleCloseCheckout();
                        }}
                        className="w-full bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                      >
                        <Plus size={16} /> {t('addToCart')}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
                    >
                      {loading ? (
                        t('processing')
                      ) : (
                        <>
                          <CheckCircle size={16} /> {t('confirmOrder')}
                        </>
                      )}
                    </button>
                    <a
                      href={buildWhatsAppOrderUrl(
                        selectedProduct,
                        fullVariant,
                        grandTotal,
                        customMeasurements,
                        customer,
                        paymentUtr,
                        customNote
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <MessageCircle size={16} /> {t('whatsappOrder')}
                    </a>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={36} className="text-emerald-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t('successTitle')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('successBody', { name: customer.name, product: checkoutMode === 'cart' ? t('cartTitle').toLowerCase() : selectedProduct.title })}
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-left text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">{t('trackProduct')}</span><span className="font-bold text-right">{checkoutMode === 'cart' ? t('cartOrderLabel') : selectedProduct.title}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('orderId')}</span><span className="font-bold">{lastOrderCode}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('successTotal')}</span><span className="font-bold text-emerald-900">₹{grandTotal}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('successPayment')}</span><span className="font-bold">{customer.paymentMethod === 'COD' ? t('cod') : t('prepaid')}</span></div>
                </div>
                <button
                  onClick={() => {
                    handleCloseCheckout();
                    setShowTracking(true);
                  }}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                >
                  <PackageSearch size={15} /> {t('trackBtn')}
                </button>
                {lastInvoice && (
                  <button
                    onClick={() => generateInvoice(lastInvoice)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                  >
                    <FileDown size={15} /> {t('invoiceBtn')}
                  </button>
                )}
                <button
                  onClick={handleCloseCheckout}
                  className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-sm transition"
                >
                  {t('successAnother')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
