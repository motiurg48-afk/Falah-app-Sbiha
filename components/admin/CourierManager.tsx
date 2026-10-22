'use client';
import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type CourierConfig = {
  id: string;
  courier_slug: string;
  api_key: string | null;
  api_secret: string | null;
  is_enabled: boolean;
  extra_config: Record<string, unknown>;
};

const DEFAULT_COURIERS: { slug: string; label: string }[] = [
  { slug: 'delhivery', label: 'Delhivery' },
  { slug: 'shiprocket', label: 'Shiprocket' },
  { slug: 'steadfast', label: 'Steadfast' },
  { slug: 'dtdc', label: 'DTDC' },
  { slug: 'bluedart', label: 'Blue Dart' },
];

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition';
const badgeCls =
  'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border';

export default function CourierManager() {
  const [configs, setConfigs] = useState<CourierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('courier_configs').select('*');
    const existing = (data ?? []) as CourierConfig[];
    const existingSlugs = new Set(existing.map((c) => c.courier_slug));
    const merged = [...existing];
    for (const def of DEFAULT_COURIERS) {
      if (!existingSlugs.has(def.slug)) {
        merged.push({
          id: '',
          courier_slug: def.slug,
          api_key: null,
          api_secret: null,
          is_enabled: false,
          extra_config: {},
        });
      }
    }
    setConfigs(merged);
    setLoading(false);
  };

  const startEdit = (c: CourierConfig) => {
    setEditingSlug(c.courier_slug);
    setApiKey(c.api_key ?? '');
    setApiSecret(c.api_secret ?? '');
    setShowSecret(false);
    setMsg('');
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setApiKey('');
    setApiSecret('');
    setShowSecret(false);
    setMsg('');
  };

  const save = async (slug: string) => {
    setSaving(true);
    setMsg('');
    try {
      const existing = configs.find((c) => c.courier_slug === slug && c.id);
      if (existing) {
        await supabase
          .from('courier_configs')
          .update({ api_key: apiKey || null, api_secret: apiSecret || null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('courier_configs').insert({
          courier_slug: slug,
          api_key: apiKey || null,
          api_secret: apiSecret || null,
          is_enabled: false,
        });
      }
      setMsg('Saved!');
      setTimeout(() => setMsg(''), 2000);
      await load();
      setEditingSlug(null);
    } catch {
      setMsg('Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: CourierConfig) => {
    setConfigs((prev) => prev.map((x) => (x.courier_slug === c.courier_slug ? { ...x, is_enabled: !x.is_enabled } : x)));
    if (c.id) {
      await supabase
        .from('courier_configs')
        .update({ is_enabled: !c.is_enabled, updated_at: new Date().toISOString() })
        .eq('id', c.id);
    } else {
      await supabase.from('courier_configs').insert({
        courier_slug: c.courier_slug,
        is_enabled: !c.is_enabled,
      });
      await load();
    }
  };

  const label = (slug: string) => DEFAULT_COURIERS.find((d) => d.slug === slug)?.label ?? slug;

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 size={20} className="animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {configs.map((c) => {
        const editing = editingSlug === c.courier_slug;
        return (
          <div key={c.courier_slug} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <Truck size={17} className="text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{label(c.courier_slug)}</h4>
                  <p className="text-[10px] text-gray-500">{c.courier_slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`${badgeCls} ${c.is_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {c.is_enabled ? <CheckCircle size={10} /> : null}
                  {c.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => toggle(c)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition ${
                    c.is_enabled ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {c.is_enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => (editing ? cancelEdit() : startEdit(c))}
                  className="px-3 py-1.5 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-200 transition"
                >
                  {editing ? 'Cancel' : 'Configure'}
                </button>
              </div>
            </div>

            {editing && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">API Secret / Token</label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Enter API secret..."
                      className={`${inputCls} pr-9`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => save(c.courier_slug)}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Save
                  </button>
                  {msg && (
                    <span className="text-xs font-bold text-emerald-700">{msg}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}