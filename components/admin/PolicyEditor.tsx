'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle, FileText, Languages, Loader2, RotateCcw, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { saveSetting } from '@/lib/catalog';
import { POLICY_CONTENT, POLICY_ORDER, POLICY_TITLES, policySettingKey, type PolicyKey } from '@/lib/policies';

type Status = { kind: 'ok' | 'err'; text: string } | null;

export default function PolicyEditor() {
  const [active, setActive] = useState<PolicyKey>('about');
  const [saved, setSaved] = useState<Partial<Record<PolicyKey, string>>>({});
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', POLICY_ORDER.map(policySettingKey));
      if (!alive) return;
      if (error) {
        setStatus({ kind: 'err', text: 'পেজগুলো লোড করা যায়নি। আবার চেষ্টা করুন।' });
      } else {
        const map: Partial<Record<PolicyKey, string>> = {};
        for (const k of POLICY_ORDER) {
          const row = (data ?? []).find((r) => r.key === policySettingKey(k));
          if (row?.value) map[k] = row.value as string;
        }
        setSaved(map);
        setDraft(map.about ?? POLICY_CONTENT.about.bn);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const select = (k: PolicyKey) => {
    setActive(k);
    setDraft(saved[k] ?? POLICY_CONTENT[k].bn);
    setStatus(null);
  };

  const persist = async (value: string) => {
    setSaving(true);
    setStatus(null);
    try {
      await saveSetting(policySettingKey(active), value);
      setSaved((prev) => {
        const next = { ...prev };
        if (value) next[active] = value;
        else delete next[active];
        return next;
      });
      if (!value) setDraft(POLICY_CONTENT[active].bn);
      setStatus({ kind: 'ok', text: value ? 'সেভ হয়েছে। ওয়েবসাইটে এখনই দেখা যাবে।' : 'ডিফল্ট লেখায় ফিরিয়ে আনা হয়েছে।' });
    } catch {
      setStatus({ kind: 'err', text: 'সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const isCustom = Boolean(saved[active]);
  const dirty = draft.trim() !== (saved[active] ?? POLICY_CONTENT[active].bn).trim();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0d0d0d] text-[#E8C34A] flex items-center justify-center flex-shrink-0">
          <FileText size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">স্টোর পলিসি ও পেজ এডিটর</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed flex items-center gap-1.5">
            <Languages size={12} className="text-emerald-700" />
            যেকোনো একটি ভাষায় লিখুন — ক্রেতা ভাষা বদলালে লেখাটি স্বয়ংক্রিয়ভাবে অনুবাদ হয়ে দেখাবে।
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr]">
        <nav className="flex md:flex-col gap-1 p-3 border-b md:border-b-0 md:border-r border-gray-100 overflow-x-auto">
          {POLICY_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => select(k)}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                active === k ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {POLICY_TITLES[k].bn}
              {saved[k] && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" title="কাস্টম লেখা" />}
            </button>
          ))}
        </nav>

        <div className="p-5 sm:p-6 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-10 justify-center">
              <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">{POLICY_TITLES[active].bn}</h4>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    isCustom ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isCustom ? 'কাস্টম' : 'ডিফল্ট'}
                </span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={14}
                maxLength={5000}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition resize-y"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => persist(draft.trim())}
                  disabled={saving || !draft.trim() || !dirty}
                  className="inline-flex items-center gap-2 bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/50 font-bold px-4 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} সেভ করুন
                </button>
                {isCustom && (
                  <button
                    onClick={() => persist('')}
                    disabled={saving}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 font-semibold px-4 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> ডিফল্টে ফিরুন
                  </button>
                )}
                <span className="text-[11px] text-gray-400 ml-auto">{draft.length}/5000</span>
              </div>
              {status && (
                <p className={`text-xs font-medium flex items-center gap-1.5 ${status.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {status.kind === 'ok' && <CheckCircle size={13} />}
                  {status.text}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
