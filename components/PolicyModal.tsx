'use client';
import React, { useEffect, useState } from 'react';
import { Folder, FolderOpen, X, ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import {
  POLICY_CONTENT,
  POLICY_ORDER,
  POLICY_TITLES,
  policySettingKey,
  type PolicyKey,
} from '@/lib/policies';
import { supabase } from '@/lib/supabase';
import TranslatedText from '@/components/TranslatedText';

export default function PolicyModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLang();
  const [openKeys, setOpenKeys] = useState<Set<PolicyKey>>(() => new Set<PolicyKey>(['about']));
  const [custom, setCustom] = useState<Partial<Record<PolicyKey, string>>>({});

  useEffect(() => {
    let alive = true;
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', POLICY_ORDER.map(policySettingKey))
      .then(({ data, error }) => {
        if (!alive || error || !data) return;
        const map: Partial<Record<PolicyKey, string>> = {};
        for (const k of POLICY_ORDER) {
          const v = data.find((r) => r.key === policySettingKey(k))?.value;
          if (typeof v === 'string' && v.trim()) map[k] = v;
        }
        setCustom(map);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (key: PolicyKey) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{t('policiesTitle')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-2.5">
          {POLICY_ORDER.map((key) => {
            const open = openKeys.has(key);
            return (
              <div
                key={key}
                className={`rounded-xl border transition-colors ${
                  open ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-white hover:border-emerald-200'
                }`}
              >
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  aria-expanded={open}
                >
                  <span className="text-xl leading-none">
                    {open ? <FolderOpen size={20} className="text-amber-500" /> : <Folder size={20} className="text-amber-600" />}
                  </span>
                  <span className="font-bold text-sm text-gray-800 flex-1">{POLICY_TITLES[key][lang]}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-0">
                      {custom[key] ? (
                        <TranslatedText text={custom[key]} className="text-sm text-gray-600 leading-relaxed" />
                      ) : (
                        <p
                          dir={lang === 'ur' ? 'rtl' : undefined}
                          className="text-sm text-gray-600 leading-relaxed whitespace-pre-line"
                        >
                          {POLICY_CONTENT[key][lang]}
                        </p>
                      )}
                      {key === 'returns' && (
                        <p className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 font-medium">
                          {t('unboxingNotice')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
