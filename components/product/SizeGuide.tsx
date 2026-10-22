'use client';
import React, { useEffect, useState } from 'react';
import { Ruler, X, Info } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const HEIGHTS = ["5'0\"", "5'2\"", "5'4\"", "5'6\""];
const SUGGESTION: Record<string, string> = { "5'0\"": '52"', "5'2\"": '54"', "5'4\"": '56"', "5'6\"": '58"' };

const SIZE_ROWS = [
  { size: 'S', length: '52"', chest: '40"', sleeve: '22"', shoulder: '14.5"', height: "4'10\" – 5'0\"" },
  { size: 'M', length: '54"', chest: '42"', sleeve: '22.5"', shoulder: '15"', height: "5'1\" – 5'2\"" },
  { size: 'L', length: '56"', chest: '44"', sleeve: '23"', shoulder: '15.5"', height: "5'3\" – 5'4\"" },
  { size: 'XL', length: '58"', chest: '46"', sleeve: '23.5"', shoulder: '16"', height: "5'5\" – 5'6\"" },
  { size: 'XXL', length: '60"', chest: '48"', sleeve: '24"', shoulder: '16.5"', height: "5'7\" +" },
];

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLang();
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fmt = (v: string) => {
    if (unit === 'in') return v;
    const n = parseFloat(v);
    return Number.isNaN(n) ? v : `${Math.round(n * 2.54)} cm`;
  };

  const steps = [
    { key: 'sgLength', hint: 'sgLengthHow' },
    { key: 'sgChest', hint: 'sgChestHow' },
    { key: 'sgSleeve', hint: 'sgSleeveHow' },
    { key: 'sgShoulder', hint: 'sgShoulderHow' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        dir={lang === 'ur' ? 'rtl' : undefined}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Ruler size={18} className="text-emerald-800" /> {t('sizeGuide')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="flex justify-end">
            <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-xs font-bold">
              {(['in', 'cm'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1 rounded-full transition ${unit === u ? 'bg-emerald-900 text-white shadow' : 'text-gray-600'}`}
                >
                  {u === 'in' ? 'Inch' : 'CM'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs text-center">
              <thead className="bg-emerald-900 text-white">
                <tr>
                  <th className="py-2.5 px-2 font-bold">{t('sgSize')}</th>
                  <th className="py-2.5 px-2 font-bold">{t('sgLength')}</th>
                  <th className="py-2.5 px-2 font-bold">{t('sgChest')}</th>
                  <th className="py-2.5 px-2 font-bold">{t('sgSleeve')}</th>
                  <th className="py-2.5 px-2 font-bold">{t('sgShoulder')}</th>
                  <th className="py-2.5 px-2 font-bold">{t('sgHeight')}</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_ROWS.map((r, i) => (
                  <tr key={r.size} className={`${i % 2 ? 'bg-gray-50' : 'bg-white'} hover:bg-emerald-50 transition-colors`}>
                    <td className="py-2.5 px-2 font-extrabold text-emerald-900">{r.size}</td>
                    <td className="py-2.5 px-2">{fmt(r.length)}</td>
                    <td className="py-2.5 px-2">{fmt(r.chest)}</td>
                    <td className="py-2.5 px-2">{fmt(r.sleeve)}</td>
                    <td className="py-2.5 px-2">{fmt(r.shoulder)}</td>
                    <td className="py-2.5 px-2 text-gray-500 whitespace-nowrap">{r.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2.5">{t('sgHowTo')}</h4>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {steps.map((s, i) => (
                <div key={s.key} className="flex gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <span className="w-6 h-6 rounded-full bg-sky-700 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-sky-950 block">{t(s.key)}</span>
                    <span className="text-[11px] text-sky-900/80 leading-relaxed">{t(s.hint)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-1.5 leading-relaxed">
            <Info size={13} className="flex-shrink-0 mt-0.5" /> {t('sgNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SizeGuide() {
  const { t } = useLang();
  const [height, setHeight] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
          <Ruler size={13} /> {t('findMySize')}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-bold text-sky-900 bg-white border border-sky-300 hover:bg-sky-100 hover:border-sky-400 px-2.5 py-1 rounded-full transition flex items-center gap-1"
        >
          <Ruler size={11} /> {t('sizeGuide')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {HEIGHTS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHeight(h)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition ${
              height === h ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-sky-900 border-sky-200 hover:border-sky-400'
            }`}
          >
            {h}
          </button>
        ))}
      </div>
      {height && (
        <p className="text-xs text-sky-900 mt-2">
          <span className="font-bold">{t('sizeRecommend')}:</span> {t('sizeRecHint')}{' '}
          <span className="font-extrabold text-base">{SUGGESTION[height]}</span>
        </p>
      )}
      {open && <SizeGuideModal onClose={() => setOpen(false)} />}
    </div>
  );
}
