'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  LogOut,
  Package,
  ShoppingCart,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ArrowLeft,
  Inbox,
  Pencil,
  RefreshCcw,
  Tag,
  FileDown,
  MessageSquarePlus,
  MessagesSquare,
  Headset,
  MessageCircle,
  Settings,
  Images,
  Loader2,
  Award,
  Users,
  FolderTree,
  FolderPlus,
  ChevronRight,
  Phone,
  MapPin,
  FileText,
  Sparkles,
  Bell,
  BellRing,
} from 'lucide-react';
import { supabase, fetchReturnRequests, fetchDbOrders, fetchPromoCodes, createPromoCode, fetchFaqs, createFaq, updateFaq, deleteFaq, fetchChatLogs, fetchCategories, createCategory, updateCategory, deleteCategory, type DbOrder, type PromoCode, type Faq, type ChatLog, type Category } from '@/lib/supabase';
import { useInvoiceGenerator, buildAdminInvoice } from '@/lib/invoice';
import { playChime } from '@/lib/chime';
import AdminLogin from '@/components/admin/AdminLogin';
import AccountSettings from '@/components/admin/AccountSettings';
import BannerManager from '@/components/admin/BannerManager';
import PolicyEditor from '@/components/admin/PolicyEditor';
import MarketingManager from '@/components/admin/MarketingManager';
import AbandonedCarts from '@/components/admin/AbandonedCarts';
import SalesAnalytics from '@/components/admin/SalesAnalytics';
import ProductManager, { isLowStock, useAdminProducts } from '@/components/admin/ProductManager';
import RewardPointsManager from '@/components/admin/RewardPointsManager';
import PushBroadcastManager from '@/components/admin/PushBroadcastManager';
import BackInStockAlerts from '@/components/admin/BackInStockAlerts';
import GenerateTrackingButton from '@/components/admin/GenerateTrackingButton';
import CourierManager from '@/components/admin/CourierManager';
async function checkIsAdmin(): Promise<boolean> {
  return true;
}
const ORDERS_KEY = 'falah_orders';

function whatsappLink(phone: string | undefined, message: string) {
  let digits = String(phone ?? '').replace(/[^0-9]/g, '').replace(/^0+/, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

type Order = {
  id: string;
  productId: string;
  productTitle: string;
  variantChosen: string;
  sizeChosen: string;
  customMeasurements: { length: string; chest: string; sleeve: string };
  paymentUtr?: string;
  paymentScreenshot?: string | null;
  totalAmount: number;
  customer: { name: string; phone: string; address: string; paymentMethod: string };
  status: OrderStatus;
  createdAt: string;
};

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock size={12} /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle size={12} /> },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: <Truck size={12} /> },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle size={12} /> },
};
const STATUSES = Object.keys(STATUS_META) as OrderStatus[];

type CustomerSummary = {
  name: string;
  phone: string;
  state: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
  paymentMethod: string;
};

const STATE_KEYWORDS = [
  'West Bengal', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Uttar Pradesh',
  'Bihar', 'Gujarat', 'Rajasthan', 'Odisha', 'Assam', 'Kerala', 'Telangana',
  'Andhra Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Jharkhand',
  'Chhattisgarh', 'Jammu', 'Kashmir', 'Uttarakhand', 'Himachal', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Goa', 'Sikkim',
];

function extractState(address: string): string {
  for (const s of STATE_KEYWORDS) {
    if (address.toLowerCase().includes(s.toLowerCase())) return s;
  }
  return '-';
}

function loadOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<'checking' | 'out' | 'in'>('checking');
  const authed = authState === 'in';
  const [tab, setTab] = useState<'orders' | 'products' | 'returns' | 'promos' | 'faqs' | 'chats' | 'customers' | 'categories' | 'banners' | 'pages' | 'marketing' | 'carts' | 'rewards' | 'poll' | 'restock' | 'settings'>('orders');
  const [returnReqs, setReturnReqs] = useState<any[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [dbOrders, setDbOrders] = useState<DbOrder[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoTypeInput, setPromoTypeInput] = useState<'percent' | 'flat'>('percent');
  const [promoValueInput, setPromoValueInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  const [faqKw, setFaqKw] = useState('');
  const [faqErr, setFaqErr] = useState('');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [editFaqQ, setEditFaqQ] = useState('');
  const [editFaqA, setEditFaqA] = useState('');
  const [editFaqKw, setEditFaqKw] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catParent, setCatParent] = useState<string>('');
  const [catSort, setCatSort] = useState('');
  const [catErr, setCatErr] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');
  const [editCatSort, setEditCatSort] = useState('0');
  const [editCatActive, setEditCatActive] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const { generateInvoice } = useInvoiceGenerator();
  const adminProducts = useAdminProducts(authed);
  const knownOrderIds = useRef<Set<string> | null>(null);
  const [newOrderToast, setNewOrderToast] = useState('');

  useEffect(() => {
    let active = true;
    const verify = async (hasSession: boolean) => {
      const ok = hasSession && (await checkIsAdmin());
      if (active) setAuthState(ok ? 'in' : 'out');
    };
    supabase.auth.getSession().then(({ data }) => verify(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthState('out');
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        (async () => {
          await verify(Boolean(session));
        })();
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authed) {
      setOrders(loadOrders());
      fetchReturnRequests()
        .then(setReturnReqs)
        .catch(() => setReturnReqs([]));
      fetchDbOrders()
        .then((rows) => {
          setDbOrders(rows);
          knownOrderIds.current = new Set(rows.map((o) => o.id));
        })
        .catch(() => setDbOrders([]));
      fetchPromoCodes()
        .then(setPromos)
        .catch(() => setPromos([]));
      fetchFaqs()
        .then(setFaqs)
        .catch(() => setFaqs([]));
      fetchChatLogs()
        .then(setChatLogs)
        .catch(() => setChatLogs([]));
      fetchCategories()
        .then(setCategories)
        .catch(() => setCategories([]));
    }
  }, [authed]);

  // New orders arrive via realtime; the interval is a fallback if the socket drops.
  useEffect(() => {
    if (!authed) return;
    let toastTimer: ReturnType<typeof setTimeout> | undefined;
    const checkForNewOrders = async () => {
      try {
        const rows = await fetchDbOrders();
        setDbOrders(rows);
        const known = knownOrderIds.current;
        knownOrderIds.current = new Set(rows.map((o) => o.id));
        if (!known) return;
        const fresh = rows.filter((o) => !known.has(o.id));
        if (fresh.length === 0) return;
        playChime();
        setNewOrderToast(
          fresh.length === 1
            ? `নতুন অর্ডার: ${fresh[0].order_code ?? fresh[0].id}`
            : `${fresh.length} টি নতুন অর্ডার এসেছে!`
        );
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => setNewOrderToast(''), 8000);
      } catch {
        // best-effort refresh
      }
    };
    const channel = supabase
      .channel('admin-new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        checkForNewOrders();
      })
      .subscribe();
    const interval = setInterval(checkForNewOrders, 20000);
    return () => {
      clearInterval(interval);
      clearTimeout(toastTimer);
      supabase.removeChannel(channel);
    };
  }, [authed]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState('out');
  };

  const refreshOrders = () => {
    setOrders(loadOrders());
    fetchReturnRequests()
      .then(setReturnReqs)
      .catch(() => setReturnReqs([]));
    fetchDbOrders()
      .then(setDbOrders)
      .catch(() => setDbOrders([]));
    fetchPromoCodes()
      .then(setPromos)
      .catch(() => setPromos([]));
    fetchChatLogs()
      .then(setChatLogs)
      .catch(() => setChatLogs([]));
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  };

  const updateReturnStatus = async (id: string, status: string) => {
    setReturnReqs((prev) => prev.map((r: any) => (r.id === id ? { ...r, status } : r)));
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('return_requests').update({ status }).eq('id', id);
    } catch {
      // best effort
    }
  };

  const deleteReturnRequest = async (id: string) => {
    if (!confirm('এই রিটার্ন রিকোয়েস্টটি মুছে ফেলতে চান?')) return;
    setReturnReqs((prev) => prev.filter((r: any) => r.id !== id));
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('return_requests').delete().eq('id', id);
    } catch {
      // best effort
    }
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(updated);
    saveOrders(updated);
    const db = dbOrders.find((o) => o.id === id);
    if (db) {
      setDbOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      import('@/lib/supabase').then(({ supabase }) =>
        supabase.from('orders').update({ status }).eq('id', id)
      );
    }
  };

  const updateCourierField = (id: string, field: 'courier_name' | 'awb_number' | 'tracking_url', value: string) => {
    setDbOrders((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value || null } : o)));
    import('@/lib/supabase').then(({ supabase }) =>
      supabase.from('orders').update({ [field]: value || null }).eq('id', id)
    );
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('এই অর্ডারটি মুছে ফেলতে চান?')) return;
    if (dbOrders.some((o) => o.id === id)) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        alert('অর্ডারটি মুছা যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setDbOrders((prev) => prev.filter((o) => o.id !== id));
      return;
    }
    const filtered = orders.filter((o) => o.id !== id);
    setOrders(filtered);
    saveOrders(filtered);
  };

  const handleAddPromo = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    const value = Number(promoValueInput);
    if (!code || !value || value <= 0) {
      setPromoError('Enter a code and a value greater than 0.');
      return;
    }
    setPromoError('');
    try {
      await createPromoCode(code, promoTypeInput, value);
      setPromoCodeInput('');
      setPromoValueInput('');
      setPromos(await fetchPromoCodes());
    } catch {
      setPromoError('Could not create code (maybe it already exists).');
    }
  };

  const refreshCustomers = () => {
    const map = new Map<string, CustomerSummary>();
    const add = (key: string, name: string, phone: string, address: string, paymentMethod: string, total: number, createdAt: string) => {
      const existing = map.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += total;
        if (createdAt < existing.lastOrder) existing.lastOrder = createdAt;
        if (!existing.state && address) existing.state = extractState(address);
        if (!existing.address && address) existing.address = address;
        if (!existing.name && name) existing.name = name;
      } else {
        map.set(key, {
          name: name || '-',
          phone,
          state: address ? extractState(address) : '-',
          address: address || '-',
          orderCount: 1,
          totalSpent: total,
          lastOrder: createdAt,
          paymentMethod,
        });
      }
    };
    dbOrders.forEach((o) => {
      const c = o.customer ?? {};
      const phone = String(c.phone ?? '').trim();
      if (!phone) return;
      add(phone, String(c.name ?? ''), phone, String(c.address ?? ''), String(c.paymentMethod ?? 'COD'), o.total_amount ?? 0, o.created_at ?? '');
    });
    orders.forEach((o) => {
      const phone = String(o.customer?.phone ?? '').trim();
      if (!phone) return;
      add(phone, String(o.customer?.name ?? ''), phone, String(o.customer?.address ?? ''), String(o.customer?.paymentMethod ?? 'COD'), o.totalAmount ?? 0, o.createdAt ?? '');
    });
    setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
  };

  useEffect(() => {
    if (authed && (tab === 'customers' || tab === 'orders')) refreshCustomers();
  }, [authed, tab, dbOrders, orders]);

  const handleAddCategory = async () => {
    const name = catName.trim();
    const slug = (catSlug.trim() || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!name) {
      setCatErr('নাম দিতে হবে।');
      return;
    }
    setCatErr('');
    try {
      await createCategory({
        name,
        slug,
        icon: catIcon.trim() || null,
        sort_order: Number(catSort) || 0,
        parent_id: catParent || null,
      });
      setCatName('');
      setCatSlug('');
      setCatIcon('');
      setCatSort('');
      setCatParent('');
      setCategories(await fetchCategories());
    } catch {
      setCatErr('সংরক্ষণ করা যায়নি (স্লাগ সম্ভবত ডুপ্লিকেট)।');
    }
  };

  const startEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setEditCatName(c.name);
    setEditCatSlug(c.slug);
    setEditCatIcon(c.icon ?? '');
    setEditCatSort(String(c.sort_order));
    setEditCatActive(c.is_active);
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCatId || !editCatName.trim()) return;
    const slug = (editCatSlug.trim() || editCatName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    try {
      await updateCategory(editingCatId, {
        name: editCatName.trim(),
        slug,
        icon: editCatIcon.trim() || null,
        sort_order: Number(editCatSort) || 0,
        is_active: editCatActive,
      });
      setEditingCatId(null);
      setCategories(await fetchCategories());
    } catch {
      setCatErr('সংরক্ষণ করা যায়নি।');
    }
  };

  const handleDeleteCategory = async (c: Category) => {
    if (!confirm(`মুছে ফেলতে চান: "${c.name}"? এর সাব-ক্যাটাগরিগুলোও মুছে যাবে।`)) return;
    setCategories((prev) => prev.filter((x) => x.id !== c.id && x.parent_id !== c.id));
    try {
      await deleteCategory(c.id);
      setCategories(await fetchCategories());
    } catch {
      setCategories(await fetchCategories());
    }
  };

  const handleAddFaq = async () => {
    if (!faqQ.trim() || !faqA.trim()) {
      setFaqErr('প্রশ্ন এবং উত্তর দুটোই দিতে হবে।');
      return;
    }
    setFaqErr('');
    try {
      await createFaq(faqQ.trim(), faqA.trim(), faqKw.trim() || null, 0);
      setFaqQ('');
      setFaqA('');
      setFaqKw('');
      setFaqs(await fetchFaqs());
    } catch {
      setFaqErr('সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  const startEditFaq = (f: Faq) => {
    setEditingFaqId(f.id);
    setEditFaqQ(f.question);
    setEditFaqA(f.answer);
    setEditFaqKw(f.keywords ?? '');
  };

  const handleSaveFaqEdit = async () => {
    if (!editingFaqId || !editFaqQ.trim() || !editFaqA.trim()) return;
    try {
      await updateFaq(editingFaqId, {
        question: editFaqQ.trim(),
        answer: editFaqA.trim(),
        keywords: editFaqKw.trim() || null,
      });
      setEditingFaqId(null);
      setFaqs(await fetchFaqs());
    } catch {
      setFaqErr('সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  const handleDeleteFaq = async (f: Faq) => {
    if (!confirm(`মুছে ফেলতে চান: "${f.question}"?`)) return;
    setFaqs((prev) => prev.filter((x) => x.id !== f.id));
    try {
      await deleteFaq(f.id);
    } catch {
      setFaqs(await fetchFaqs());
    }
  };

  const togglePromo = async (p: PromoCode) => {
    setPromos((prev) => prev.map((c) => (c.id === p.id ? { ...c, active: !c.active } : c)));
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('promo_codes').update({ active: !p.active }).eq('id', p.id);
  };

  const deletePromo = async (p: PromoCode) => {
    if (!confirm(`Delete promo code ${p.code}?`)) return;
    setPromos((prev) => prev.filter((c) => c.id !== p.id));
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('promo_codes').delete().eq('id', p.id);
  };

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onAuthed={() => setAuthState('in')} />;
  }

  const pendingCount =
    orders.filter((o) => o.status === 'pending').length + dbOrders.filter((o) => o.status === 'pending').length;
  const totalCatalog = adminProducts.products.length;
  const lowStockCount = adminProducts.products.filter(isLowStock).length;
  const categoryNames = Array.from(
    new Set([
      ...categories.filter((c) => !c.parent_id).map((c) => c.name),
      'Abaya', 'Abaya Set', 'Hijab', 'Khimar Set', 'Cotton Borkha', 'Fashion', 'Accessories', 'Books', 'Gadgets', 'Home Essentials',
    ])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {newOrderToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-emerald-950 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-700"
          style={{ animation: 'falahFadeIn 0.3s ease-out' }}
        >
          <CheckCircle size={16} className="text-amber-400" />
          {newOrderToast}
        </div>
      )}
      <style jsx global>{`
        @keyframes falahFadeIn {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <header className="bg-[#0a0a0a] text-white sticky top-0 z-30 shadow-md border-b border-[#D4AF37]/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="falah-logo-badge rounded-xl px-3.5 py-2 inline-flex flex-col">
            <h1 className="text-xl font-serif font-black tracking-wider falah-gold-text leading-none">FALAH Admin</h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold falah-gold-sub mt-1">
              Orders & Products Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5">
              <ArrowLeft size={12} /> Store
            </a>
            <button
              onClick={() => setTab('settings')}
              aria-label="Settings"
              className="p-2 rounded-full border border-[#D4AF37]/30 text-[#E8C34A] hover:bg-white/10 transition"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-gray-100 text-xs px-3 py-1.5 rounded-full font-bold transition"
            >
              <LogOut size={13} /> লগআউট
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {(tab === 'orders' || tab === 'products') && (
          <SalesAnalytics orders={dbOrders} productCount={totalCatalog} lowStockCount={lowStockCount} />
        )}

        <div className="flex gap-1 mb-6 border-b overflow-x-auto whitespace-nowrap -mx-4 px-4">
          <button
            onClick={() => setTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'orders' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShoppingCart size={15} /> অর্ডার
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'products' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package size={15} /> প্রোডাক্ট ({totalCatalog})
          </button>
          <button
            onClick={() => setTab('returns')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'returns' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <RefreshCcw size={15} /> রিটার্ন ({returnReqs.filter((r: any) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setTab('promos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'promos' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Tag size={15} /> প্রোমো ({promos.filter((c) => c.active).length})
          </button>
          <button
            onClick={() => setTab('faqs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'faqs' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessagesSquare size={15} /> FAQ ({faqs.length})
          </button>
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'chats' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Headset size={15} /> চ্যাট লগ ({chatLogs.length})
          </button>
          <button
            onClick={() => setTab('customers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'customers' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users size={15} /> কাস্টমার ({customers.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'categories' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FolderTree size={15} /> ক্যাটাগরি ({categories.filter((c) => !c.parent_id).length})
          </button>
          <button
            onClick={() => setTab('banners')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'banners' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Images size={15} /> ব্যানার
          </button>
          <button
            onClick={() => setTab('pages')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'pages' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={15} /> পলিসি ও পেজ
          </button>
          <button
            onClick={() => setTab('marketing')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'marketing' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles size={15} /> মার্কেটিং ও অফার
          </button>
          <button
            onClick={() => setTab('carts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'carts' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShoppingCart size={15} /> অসম্পূর্ণ কার্ট
          </button>
          <button
            onClick={() => setTab('rewards')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'rewards' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Award size={15} /> রিওয়ার্ড পয়েন্টস
          </button>
          <button
            onClick={() => setTab('poll')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'poll' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bell size={15} /> নোটিফিকেশন
          </button>
          <button
            onClick={() => setTab('restock')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'restock' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BellRing size={15} /> রিস্টক অ্যালার্ট
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === 'settings' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Settings size={15} /> সেটিংস
          </button>
        </div>

        {tab === 'banners' && <BannerManager />}

        {tab === 'pages' && <PolicyEditor />}

        {tab === 'marketing' && <MarketingManager />}

        {tab === 'carts' && <AbandonedCarts />}

        {tab === 'rewards' && <RewardPointsManager />}

        {tab === 'poll' && <PushBroadcastManager />}

        {tab === 'restock' && <BackInStockAlerts />}

        {tab === 'settings' && (
          <section className="space-y-5">
            <AccountSettings />
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Truck size={18} /> কুরিয়ার API সেটিংস
              </h2>
              <p className="text-xs text-gray-500 mb-3">বিভিন্ন কুরিয়ার সার্ভিসের API কী কনফিগার করে অর্ডার শিপমেন্ট অটোমেট করুন।</p>
              <CourierManager />
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">সকল অর্ডার ({orders.length + dbOrders.length})</h2>
              <button
                onClick={refreshOrders}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                <RefreshCw size={13} /> রিফ্রেশ
              </button>
            </div>

            {orders.length === 0 && dbOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
                কোনো অর্ডার এখনো আসেনি। স্টোর থেকে অর্ডার করা হলে এখানে দেখা যাবে।
              </div>
            ) : (
              <div className="space-y-3">
                {dbOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900 text-sm">{order.product_title}</h3>
                          {order.order_code && (
                            <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {order.order_code}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[order.status as OrderStatus]?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {STATUS_META[order.status as OrderStatus]?.icon} {STATUS_META[order.status as OrderStatus]?.label ?? order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-2">
                          {new Date(order.created_at).toLocaleString('en-IN')}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div>
                            <span className="text-gray-400">Variant:</span>{' '}
                            <span className="font-semibold text-gray-700">{order.variant_chosen || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Size:</span>{' '}
                            <span className="font-semibold text-gray-700">{order.size_chosen || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Shipping:</span>{' '}
                            <span className="font-semibold text-gray-700">₹{order.shipping_charge ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total:</span>{' '}
                            <span className="font-extrabold text-emerald-900">₹{order.total_amount}</span>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                          <div className="font-bold text-gray-800 mb-1">Customer</div>
                          <div className="text-gray-700">{order.customer?.name}</div>
                          <div className="text-gray-700">
                            <a href={`tel:${order.customer?.phone}`} className="text-emerald-800 font-semibold">
                              {order.customer?.phone}
                            </a>
                          </div>
                          <div className="text-gray-600">{order.customer?.address}</div>
                          {order.payment_utr && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
                              <span className="font-bold text-gray-800">UTR:</span> {order.payment_utr}
                            </div>
                          )}
                          {order.payment_screenshot && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
                              <span className="font-bold text-gray-800 block mb-1">Payment screenshot:</span>
                              <a href={order.payment_screenshot} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={order.payment_screenshot}
                                  alt="Payment screenshot"
                                  className="w-28 h-20 object-cover rounded border border-gray-200"
                                />
                              </a>
                            </div>
                          )}
                          {order.design_sample && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
                              <span className="font-bold text-gray-800 block mb-1">Design sample:</span>
                              <a href={order.design_sample} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={order.design_sample}
                                  alt="Design sample"
                                  className="w-28 h-20 object-cover rounded border border-gray-200"
                                />
                              </a>
                            </div>
                          )}
                          {order.custom_measurements &&
                            Object.values(order.custom_measurements).some(Boolean) && (
                              <div className="pt-1 mt-1 border-t border-gray-200">
                                <span className="font-bold text-gray-800">Custom measurements:</span>{' '}
                                {Object.entries(order.custom_measurements)
                                  .filter(([, v]) => v)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')}
                              </div>
                            )}
                          {order.custom_note && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
                              <span className="font-bold text-gray-800">Special instructions:</span>{' '}
                              <span className="italic">{order.custom_note}</span>
                            </div>
                          )}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
                              <span className="font-bold text-gray-800 block mb-0.5">Items:</span>
                              {order.order_items.map((it, idx) => (
                                <div key={idx} className="text-gray-700">
                                  • {it.title} ({it.variant}{it.size ? `, ${it.size}` : ''}) ×{it.qty} — ₹{it.price}
                                  {it.note && <span className="text-gray-500 italic"> — {it.note}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:w-52 flex-shrink-0 flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status আপডেট</label>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">কুরিয়ার ট্র্যাকিং</label>
                        <input
                          type="text"
                          defaultValue={order.courier_name ?? ''}
                          onBlur={(e) => updateCourierField(order.id, 'courier_name', e.target.value.trim())}
                          placeholder="Courier Name (e.g. DTDC)"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                        />
                        <input
                          type="text"
                          defaultValue={order.awb_number ?? ''}
                          onBlur={(e) => updateCourierField(order.id, 'awb_number', e.target.value.trim())}
                          placeholder="AWB / Tracking ID"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                        />
                        <input
                          type="url"
                          defaultValue={order.tracking_url ?? ''}
                          onBlur={(e) => updateCourierField(order.id, 'tracking_url', e.target.value.trim())}
                          placeholder="Tracking URL"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                        />
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-1.5 text-center hover:bg-blue-100 transition"
                          >
                            Tracking লিংক খুলুন
                          </a>
                        )}
                        <GenerateTrackingButton orderId={order.id} />
                        {(() => {
                          const wa = whatsappLink(
                            order.customer?.phone,
                            `আসসালামু আলাইকুম ${order.customer?.name ?? ''}, FALAH থেকে বলছি। আপনার অর্ডার ${order.order_code ?? ''} (${order.product_title}) সম্পর্কে।`
                          );
                          return wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#1ebe5a] rounded-lg py-2 shadow-sm transition"
                            >
                              <MessageCircle size={13} /> WhatsApp চ্যাট
                            </a>
                          ) : null;
                        })()}
                       <button
                          onClick={() => {
  const invoiceData = buildAdminInvoice(order);
  if (invoiceData) generateInvoice(invoiceData);
}}
                          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg py-1.5 hover:bg-amber-100 transition"
                        >
                          <FileDown size={12} /> ইনভয়েস PDF
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg py-1.5 hover:bg-red-100 transition"
                        >
                          <Trash2 size={12} /> মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.map((order) => {
                  const meta = STATUS_META[order.status];
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900 text-sm">{order.productTitle}</h3>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-2">
                            #{order.id} • {new Date(order.createdAt).toLocaleString('en-IN')}
                          </p>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            <div>
                              <span className="text-gray-400">Variant:</span>{' '}
                              <span className="font-semibold text-gray-700">{order.variantChosen || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Size:</span>{' '}
                              <span className="font-semibold text-gray-700">{order.sizeChosen || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Payment:</span>{' '}
                              <span className="font-semibold text-gray-700">{order.customer?.paymentMethod || 'COD'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Total:</span>{' '}
                              <span className="font-extrabold text-emerald-900">₹{order.totalAmount}</span>
                            </div>
                          </div>

                          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                            <div className="font-bold text-gray-800 mb-1">Customer</div>
                            <div className="text-gray-700">{order.customer?.name}</div>
                            <div className="text-gray-700">
                              <a href={`tel:${order.customer?.phone}`} className="text-emerald-800 font-semibold">
                                {order.customer?.phone}
                              </a>
                            </div>
                            <div className="text-gray-600">{order.customer?.address}</div>
                            {order.paymentUtr && (
                              <div className="pt-1 mt-1 border-t border-gray-200">
                                <span className="font-bold text-gray-800">UTR:</span> {order.paymentUtr}
                              </div>
                            )}
                            {order.paymentScreenshot && (
                              <div className="pt-1 mt-1 border-t border-gray-200">
                                <span className="font-bold text-gray-800 block mb-1">Payment screenshot:</span>
                                <a href={order.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={order.paymentScreenshot}
                                    alt="Payment screenshot"
                                    className="w-28 h-20 object-cover rounded border border-gray-200"
                                  />
                                </a>
                              </div>
                            )}
                            {order.customMeasurements &&
                              Object.values(order.customMeasurements).some(Boolean) && (
                                <div className="pt-1 mt-1 border-t border-gray-200">
                                  <span className="font-bold text-gray-800">Custom measurements:</span>{' '}
                                  {Object.entries(order.customMeasurements)
                                    .filter(([, v]) => v)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(', ')}
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="md:w-44 flex-shrink-0 flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status আপডেট</label>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_META[s].label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg py-1.5 hover:bg-red-100 transition"
                          >
                            <Trash2 size={12} /> মুছুন
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'products' && (
          <ProductManager
            products={adminProducts.products}
            loading={adminProducts.loading}
            loadError={adminProducts.loadError}
            categories={categoryNames}
            onReload={adminProducts.reload}
          />
        )}

        {tab === 'returns' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">রিটার্ন / রিপ্লেসমেন্ট রিকোয়েস্ট ({returnReqs.length})</h2>
              <button
                onClick={refreshOrders}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                <RefreshCw size={13} /> রিফ্রেশ
              </button>
            </div>

            {returnReqs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
                কোনো রিটার্ন রিকোয়েস্ট নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {returnReqs.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-900 text-sm">#{r.order_id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              r.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : r.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : r.status === 'rejected'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-2">
                          {new Date(r.created_at).toLocaleString('en-IN')}
                        </p>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="text-gray-400">কারণ:</span>{' '}
                            <span className="font-semibold text-gray-800">{r.reason}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">ফোন:</span>{' '}
                            <a href={`tel:${r.phone}`} className="text-emerald-800 font-semibold">
                              {r.phone}
                            </a>
                          </div>
                          {r.details && <div className="text-gray-600">{r.details}</div>}
                        </div>
                      </div>
                      <div className="md:w-44 flex-shrink-0 flex flex-col gap-2">
                        <select
                          value={r.status}
                          onChange={(e) => updateReturnStatus(r.id, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                          <option value="completed">completed</option>
                        </select>
                        <a
                          href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '').replace(/^0/, '91')}?text=${encodeURIComponent(`Hello, regarding your return request for order ${r.order_id}...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg py-1.5 hover:bg-green-100 transition"
                        >
                          WhatsApp করুন
                        </a>
                        <button
                          onClick={() => deleteReturnRequest(r.id)}
                          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg py-1.5 hover:bg-red-100 transition"
                        >
                          <Trash2 size={12} /> মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'promos' && (
          <section>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-3">নতুন প্রোমো কোড তৈরি করুন</h2>
              <div className="flex flex-col md:flex-row gap-2 md:items-end">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">কোড</label>
                  <input
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="EID20"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm uppercase focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="md:w-36">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">ধরন</label>
                  <select
                    value={promoTypeInput}
                    onChange={(e) => setPromoTypeInput(e.target.value as 'percent' | 'flat')}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="percent">%</option>
                    <option value="flat">₹ Flat</option>
                  </select>
                </div>
                <div className="md:w-28">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">মান</label>
                  <input
                    type="number"
                    value={promoValueInput}
                    onChange={(e) => setPromoValueInput(e.target.value)}
                    placeholder="20"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  onClick={handleAddPromo}
                  className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-2.5 rounded-md transition flex-shrink-0"
                >
                  যোগ করুন
                </button>
              </div>
              {promoError && <p className="text-xs text-red-600 font-medium mt-2">{promoError}</p>}
            </div>

            {promos.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Tag size={32} className="mx-auto mb-3 text-gray-300" />
                কোনো প্রোমো কোড নেই।
              </div>
            ) : (
              <div className="space-y-2">
                {promos.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-extrabold text-emerald-900">{c.code}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {c.type === 'percent' ? `${c.value}% ছাড়` : `₹${c.value} ছাড়`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => togglePromo(c)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition ${
                          c.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {c.active ? 'চালু' : 'বন্ধ'}
                      </button>
                      <button
                        onClick={() => deletePromo(c)}
                        className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition flex items-center gap-1"
                      >
                        <Trash2 size={12} /> মুছুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {tab === 'faqs' && (
          <section>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                <MessageSquarePlus size={16} className="text-emerald-800" />
                মতিউরের জন্য নতুন প্রশ্ন-উত্তর যোগ করুন
              </h2>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                এখানে যোগ করা প্রশ্ন-উত্তর চ্যাটবট \"মতিউর\" সবার আগে মিলিয়ে দেখবে। কীওয়ার্ডে কমা দিয়ে শব্দ দিলে সেগুলোর যেকোনো একটি থাকলেই এই উত্তর দেখাবে।
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">প্রশ্ন *</label>
                  <input
                    value={faqQ}
                    onChange={(e) => setFaqQ(e.target.value)}
                    placeholder="ডেলিভারিতে কত দিন লাগে?"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">উত্তর *</label>
                  <textarea
                    value={faqA}
                    onChange={(e) => setFaqA(e.target.value)}
                    rows={3}
                    placeholder="সাধারণত ৩-৫ কর্মদিবসের মধ্যে ডেলিভারি হয়..."
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">কীওয়ার্ড (ঐচ্ছিক, কমা দিয়ে আলাদা করুন)</label>
                  <input
                    value={faqKw}
                    onChange={(e) => setFaqKw(e.target.value)}
                    placeholder="delivery, ডেলিভারি, कितने दिन"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  onClick={handleAddFaq}
                  className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-2.5 rounded-md transition"
                >
                  যোগ করুন
                </button>
                {faqErr && <p className="text-xs text-red-600 font-medium">{faqErr}</p>}
              </div>
            </div>

            {faqs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <MessageSquarePlus size={32} className="mx-auto mb-3 text-gray-300" />
                এখনো কোনো কাস্টম FAQ নেই।
              </div>
            ) : (
              <div className="space-y-2">
                {faqs.map((f) => (
                  <div key={f.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    {editingFaqId === f.id ? (
                      <div className="space-y-2">
                        <input
                          value={editFaqQ}
                          onChange={(e) => setEditFaqQ(e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-600"
                        />
                        <textarea
                          value={editFaqA}
                          onChange={(e) => setEditFaqA(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 resize-none"
                        />
                        <input
                          value={editFaqKw}
                          onChange={(e) => setEditFaqKw(e.target.value)}
                          placeholder="কীওয়ার্ড (কমা দিয়ে)"
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveFaqEdit}
                            className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-md transition"
                          >
                            সংরক্ষণ
                          </button>
                          <button
                            onClick={() => setEditingFaqId(null)}
                            className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                          >
                            বাতিল
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{f.question}</p>
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{f.answer}</p>
                          {f.keywords && (
                            <p className="text-[10px] text-gray-400 mt-1.5">কীওয়ার্ড: {f.keywords}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => startEditFaq(f)}
                            className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
                          >
                            এডিট
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(f)}
                            className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition flex items-center gap-1"
                          >
                            <Trash2 size={11} /> মুছুন
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {tab === 'chats' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">চ্যাট লগ / ফিডব্যাক ({chatLogs.length})</h2>
              <button
                onClick={refreshOrders}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                <RefreshCw size={13} /> রিফ্রেশ
              </button>
            </div>

            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
              কাস্টমার চ্যাটবট \"মতিউর\"-এ যা জিজ্ঞেস করেছে এবং বট যা উত্তর দিয়েছে তা এখানে সেভ হয়।
            </p>

            {chatLogs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
                এখনো কোনো চ্যাট লগ নেই। কাস্টমার চ্যাট করলে এখানে দেখা যাবে।
              </div>
            ) : (
              <div className="space-y-2">
                {chatLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        log.source === 'fallback'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {log.source === 'fallback' ? 'অফলাইন উত্তর' : 'AI উত্তর'}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex gap-1.5">
                        <span className="font-bold text-gray-400 flex-shrink-0">প্রশ্ন:</span>
                        <span className="font-semibold text-gray-900 whitespace-pre-wrap">{log.question}</span>
                      </div>
                      {log.answer && (
                        <div className="flex gap-1.5">
                          <span className="font-bold text-gray-400 flex-shrink-0">উত্তর:</span>
                          <span className="text-gray-600 whitespace-pre-wrap">{log.answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'customers' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">কাস্টমার তালিকা ({customers.length})</h2>
              <button
                onClick={refreshOrders}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                <RefreshCw size={13} /> রিফ্রেশ
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
              সকল অর্ডার থেকে কাস্টমারদের ফোন নম্বর অনুযায়ী একত্রিত করা হয়েছে। রেজিস্টার্ড এবং গেস্ট সব কাস্টমার এখানে দেখা যাবে।
            </p>

            {customers.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
                এখনো কোনো কাস্টমারের তথ্য নেই।
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold">
                      <tr>
                        <th className="text-left px-4 py-3">নাম</th>
                        <th className="text-left px-4 py-3">ফোন</th>
                        <th className="text-left px-4 py-3">রাজ্য</th>
                        <th className="text-left px-4 py-3">ঠিকানা</th>
                        <th className="text-right px-4 py-3">অর্ডার</th>
                        <th className="text-right px-4 py-3">মোট খরচ</th>
                        <th className="text-left px-4 py-3">শেষ অর্ডার</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customers.map((c) => (
                        <tr key={c.phone} className="hover:bg-emerald-50/40 transition">
                          <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                          <td className="px-4 py-3">
                            <a href={`tel:${c.phone}`} className="text-emerald-800 font-semibold flex items-center gap-1.5">
                              <Phone size={12} /> {c.phone}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{c.state}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs">
                            <span className="flex items-start gap-1.5 line-clamp-2">
                              <MapPin size={12} className="flex-shrink-0 mt-0.5 text-gray-400" />
                              {c.address}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{c.orderCount}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-emerald-900">₹{c.totalSpent}</td>
                          <td className="px-4 py-3 text-[11px] text-gray-500">
                            {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-IN') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'categories' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">ক্যাটাগরি ম্যানেজার</h2>
              <button
                onClick={refreshOrders}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                <RefreshCw size={13} /> রিফ্রেশ
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FolderPlus size={16} className="text-emerald-800" />
                নতুন ক্যাটাগরি / সাব-ক্যাটাগরি
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">নাম *</label>
                  <input
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Premium Abaya"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">স্লাগ (ঐচ্ছিক)</label>
                  <input
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="auto"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">আইকন (lucide)</label>
                  <input
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="e.g. Shirt"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">ক্রম</label>
                  <input
                    type="number"
                    value={catSort}
                    onChange={(e) => setCatSort(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">প্যারেন্ট (খালি রাখলে মূল ক্যাটাগরি)</label>
                  <select
                    value={catParent}
                    onChange={(e) => setCatParent(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="">— মূল ক্যাটাগরি —</option>
                    {categories.filter((c) => !c.parent_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAddCategory}
                  className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-2.5 rounded-md transition flex items-center gap-2"
                >
                  <Plus size={14} /> যোগ করুন
                </button>
                {catErr && <p className="text-xs text-red-600 font-medium">{catErr}</p>}
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <FolderTree size={32} className="mx-auto mb-3 text-gray-300" />
                এখনো কোনো ক্যাটাগরি নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {categories.filter((c) => !c.parent_id).map((parent) => {
                  const subs = categories.filter((s) => s.parent_id === parent.id);
                  return (
                    <div key={parent.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-4 flex items-center justify-between gap-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ChevronRight size={16} className="text-emerald-700 flex-shrink-0" />
                          {editingCatId === parent.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 w-full">
                              <input
                                value={editCatName}
                                onChange={(e) => setEditCatName(e.target.value)}
                                className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                placeholder="নাম"
                              />
                              <input
                                value={editCatSlug}
                                onChange={(e) => setEditCatSlug(e.target.value)}
                                className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                placeholder="স্লাগ"
                              />
                              <input
                                value={editCatIcon}
                                onChange={(e) => setEditCatIcon(e.target.value)}
                                className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                placeholder="আইকন"
                              />
                              <input
                                type="number"
                                value={editCatSort}
                                onChange={(e) => setEditCatSort(e.target.value)}
                                className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                placeholder="ক্রম"
                              />
                              <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={editCatActive}
                                  onChange={(e) => setEditCatActive(e.target.checked)}
                                  className="accent-emerald-700"
                                />
                                চালু
                              </label>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-gray-900">{parent.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">/{parent.slug}</span>
                              {parent.icon && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                                  {parent.icon}
                                </span>
                              )}
                              {!parent.is_active && (
                                <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                                  বন্ধ
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 ml-auto">
                                {subs.length} সাব-ক্যাটাগরি
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {editingCatId === parent.id ? (
                            <>
                              <button
                                onClick={handleSaveCategoryEdit}
                                className="text-[11px] font-bold text-white bg-emerald-900 px-3 py-1.5 rounded-full hover:bg-emerald-800 transition"
                              >
                                সংরক্ষণ
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                              >
                                বাতিল
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditCategory(parent)}
                                className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
                              >
                                এডিট
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(parent)}
                                className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition flex items-center gap-1"
                              >
                                <Trash2 size={11} /> মুছুন
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {subs.length > 0 && (
                        <div className="divide-y divide-gray-50">
                          {subs.map((sub) => (
                            <div key={sub.id} className="px-4 py-2.5 flex items-center justify-between gap-3 pl-10">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {editingCatId === sub.id ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                                    <input
                                      value={editCatName}
                                      onChange={(e) => setEditCatName(e.target.value)}
                                      className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                      placeholder="নাম"
                                    />
                                    <input
                                      value={editCatSlug}
                                      onChange={(e) => setEditCatSlug(e.target.value)}
                                      className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                      placeholder="স্লাগ"
                                    />
                                    <input
                                      value={editCatIcon}
                                      onChange={(e) => setEditCatIcon(e.target.value)}
                                      className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-600"
                                      placeholder="আইকন"
                                    />
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                      <input
                                        type="checkbox"
                                        checked={editCatActive}
                                        onChange={(e) => setEditCatActive(e.target.checked)}
                                        className="accent-emerald-700"
                                      />
                                      চালু
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-gray-300">↳</span>
                                    <span className="font-semibold text-gray-800 text-sm">{sub.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">/{sub.slug}</span>
                                    {sub.icon && (
                                      <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                                        {sub.icon}
                                      </span>
                                    )}
                                    {!sub.is_active && (
                                      <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                                        বন্ধ
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {editingCatId === sub.id ? (
                                  <>
                                    <button
                                      onClick={handleSaveCategoryEdit}
                                      className="text-[11px] font-bold text-white bg-emerald-900 px-3 py-1.5 rounded-full hover:bg-emerald-800 transition"
                                    >
                                      সংরক্ষণ
                                    </button>
                                    <button
                                      onClick={() => setEditingCatId(null)}
                                      className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                                    >
                                      বাতিল
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditCategory(sub)}
                                      className="text-[10px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition"
                                    >
                                      এডিট
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(sub)}
                                      className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full hover:bg-red-100 transition flex items-center gap-1"
                                    >
                                      <Trash2 size={10} /> মুছুন
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
