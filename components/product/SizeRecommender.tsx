'use client';
import React, { useState } from 'react';
import { Ruler, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const SIZE_CHART: { size: string; label: string; chest: string; height: string }[] = [
  { size: 'S', label: 'Small (52")', chest: '38-40"', height: "5'0\" – 5'2\"" },
  { size: 'M', label: 'Medium (54")', chest: '40-42"', height: "5'2\" – 5'4\"" },
  { size: 'L', label: 'Large (56")', chest: '42-44"', height: "5'4\" – 5'7\"" },
  { size: 'XL', label: 'X-Large (58")', chest: '44-46"', height: "5'7\" – 5'10\"" },
  { size: 'XXL', label: 'XX-Large (60")', chest: '46-48"', height: "5'10\" – 6'0\"" },
];

function recommendSize(heightCm: number, weightKg: number): string {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (heightCm <= 157) return 'S';
  if (heightCm <= 163) return bmi > 30 ? 'L' : 'M';
  if (heightCm <= 170) return bmi > 30 ? 'XL' : 'L';
  if (heightCm <= 178) return bmi > 30 ? 'XXL' : 'XL';
  return 'XXL';
}

function sizeLabel(s: string): string {
  const entry = SIZE_CHART.find((x) => x.size === s);
  return entry ? entry.label : s;
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 transition';

export default function SizeRecommender({ onSelect }: { onSelect?: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h < 100 || h > 250 || w < 30 || w > 200) return;
    const size = recommendSize(h, w);
    setResult(size);
    onSelect?.(size);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-600" />
          <span className="text-sm font-bold text-amber-900">Smart Size Finder</span>
        </div>
        {open ? <ChevronUp size={15} className="text-amber-600" /> : <ChevronDown size={15} className="text-amber-600" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[11px] text-amber-800">
            Enter your height and weight — we will recommend the best size for you.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-amber-800 block mb-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => { setHeight(e.target.value); setResult(null); }}
                placeholder="e.g. 165"
                min={100}
                max={250}
                className={`${inputCls} border-amber-300`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-amber-800 block mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); setResult(null); }}
                placeholder="e.g. 65"
                min={30}
                max={200}
                className={`${inputCls} border-amber-300`}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={calculate}
            disabled={!height || !weight}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
          >
            <Ruler size={13} /> Find My Size
          </button>

          {result && (
            <div className="bg-white border border-amber-300 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Recommended size:</p>
              <p className="text-lg font-extrabold text-amber-900">{sizeLabel(result)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Based on height {height}cm and weight {weight}kg
              </p>
            </div>
          )}

          <details className="text-[11px] text-amber-800">
            <summary className="cursor-pointer font-semibold">View full size chart</summary>
            <div className="mt-2 space-y-1">
              {SIZE_CHART.map((s) => (
                <div key={s.size} className="flex justify-between text-xs py-1 border-b border-amber-100 last:border-0">
                  <span className="font-bold">{s.label}</span>
                  <span className="text-gray-500">Chest: {s.chest} | H: {s.height}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}