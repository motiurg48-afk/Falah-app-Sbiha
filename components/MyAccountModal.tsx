'use client';
import React, { useState, useEffect } from 'react';
import { X, Search, Truck, Pencil, XCircle, Loader2, RefreshCw, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCustomerAuth } from '@/lib/customer-auth';
import CustomerLoginModal from '@/components/CustomerLoginModal';
import { useLang } from '@/lib/i18n';

type MyOrder = {
  id: string;
  order_code: string | null;
  product_title: string;
  variant_chosen: string | null;
  size_chosen: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  customer: { name?: string; phone?: string; address?: string };
  courier_name?: string | null;
  awb_number?: string | null;
  tracking_url?: string | null;
};

const inputCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 transition';

export default function MyAccountModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { session, logout } = useCustomerAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSize, setEditSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState<'ok' | 'err'>('ok');

  const loadOrders = async () => {
    if (!session) return;
    setLoading(true);
    const digits = session.phone;
    const { data } = await supabase
      .from('orders')
      .select('id, order_code, product_title, variant_chosen, size_chosen, status, total_amount, created_at, customer, courier_name, awb_number, tracking_url')
      .ilike('customer->>phone', `%${digits}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders((data ?? []) as MyOrder[]);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, [session]);

  const startEdit = (o: MyOrder) => {
    setEditingId(o.id);
    setEditName(String((o.customer as any)?.name ?? ''));
    setEditAddress(String((o.customer as any)?.address ?? ''));
    setEditSize(o.size_chosen ?? '');
    setMsg('');
  };

  const saveEdit = async (orderId: string) => {
    if (!session) return;
    setSaving(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-order`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: session.token,
          order_id: orderId,
          action: 'edit',
          payload: { customer_name: editName, customer_address: editAddress, size_chosen: editSize },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg('Order updated');
        setMsgKind('ok');
        setEditingId(null);
        loadOrders();
      } else {
        setMsg(json.error || 'Update failed');
        setMsgKind('err');
      }
    } catch {
      setMsg('Network error');
      setMsgKind('err');
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    if (!session) return;
    setSaving(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-order`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: session.token, order_id: orderId, action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg('Order cancelled');
        setMsgKind('ok');
        loadOrders();
      } else {
        setMsg(json.error || 'Cancel failed');
        setMsgKind('err');
      }
    } catch {
      setMsg('Network error');
      setMsgKind('err');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <User size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-bold text-gray-900 mb-1">My Account</h3>
            <p className="text-xs text-gray-500 mb-4">Login to view your orders and manage them.</p>
            <button
              onClick={() => setShowLogin(true)}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition"
            >
              Login with Phone
            </button>
            <button onClick={onClose} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Close</button>
          </div>
        </div>
        {showLogin && <CustomerLoginModal onClose={() => { setShowLogin(false); }} />}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <User size={17} className="text-emerald-800" /> My Orders
            </h3>
            <p className="text-[10px] text-gray-500">{session.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { logout(); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium">
              <LogOut size={12} /> Logout
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <button onClick={loadOrders} className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-2">
            <RefreshCw size={12} /> Refresh
          </button>
          {msg && (
            <p className={`text-xs font-bold ${msgKind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
          {loading ? (
            <div className="text-center py-8 text-gray-400"><Loader2 size={20} className="animate-spin mx-auto" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No orders found for this phone number.</div>
          ) : (
            orders.map((o) => {
              const editable = o.status === 'pending' || o.status === 'confirmed';
              const editing = editingId === o.id;
              return (
                <div key={o.id} className="border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400">#{o.order_code ?? o.id.slice(0, 8)}</span>
                      <h4 className="text-sm font-bold text-gray-900">{o.product_title}</h4>
                      {o.variant_chosen && <span className="text-[11px] text-gray-500">{o.variant_chosen}</span>}
                      {o.size_chosen && <span className="text-[11px] text-gray-500 ml-2">Size: {o.size_chosen}</span>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      o.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      o.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      o.status === 'shipped' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-extrabold text-emerald-900">₹{o.total_amount}</span>
                  </div>

                  {o.tracking_url && o.awb_number && (
                    <div className="text-[10px] space-y-1">
                      <div className="text-gray-500">Tracking: <span className="font-bold text-gray-800">{o.awb_number}</span></div>
                      <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline flex items-center gap-1">
                        <Truck size={10} /> Track Shipment
                      </a>
                    </div>
                  )}

                  {editable && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => editing ? setEditingId(null) : startEdit(o)}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1 hover:bg-blue-100 transition"
                      >
                        <Pencil size={11} /> {editing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => cancelOrder(o.id)}
                        disabled={saving}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <XCircle size={11} /> Cancel Order
                      </button>
                    </div>
                  )}

                  {editing && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2 animate-in fade-in">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className={inputCls} />
                      <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Address" className={inputCls} />
                      <select value={editSize} onChange={(e) => setEditSize(e.target.value)} className={`${inputCls} bg-white`}>
                        <option value="">Size (unchanged)</option>
                        <option value="S">S (52&quot;)</option>
                        <option value="M">M (54&quot;)</option>
                        <option value="L">L (56&quot;)</option>
                        <option value="XL">XL (58&quot;)</option>
                        <option value="XXL">XXL (60&quot;)</option>
                      </select>
                      <button
                        onClick={() => saveEdit(o.id)}
                        disabled={saving}
                        className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-1.5 rounded-md text-xs transition flex items-center justify-center gap-1"
                      >
                        {saving ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}