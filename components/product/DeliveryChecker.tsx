'use client';
import React, { useState } from 'react';
import { MapPin, Truck, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { INDIAN_STATES, getDistrictsForState, getShippingCharge } from '@/lib/location-data';

const PIN_PREFIX_3: Record<string, string> = {
  '160': 'Chandigarh', '194': 'Ladakh', '403': 'Goa', '605': 'Puducherry', '737': 'Sikkim', '744': 'Andaman & Nicobar Islands',
  '244': 'Uttarakhand', '246': 'Uttarakhand', '247': 'Uttarakhand', '248': 'Uttarakhand', '249': 'Uttarakhand',
  '262': 'Uttarakhand', '263': 'Uttarakhand',
  '790': 'Arunachal Pradesh', '791': 'Arunachal Pradesh', '792': 'Arunachal Pradesh', '793': 'Meghalaya', '794': 'Meghalaya',
  '795': 'Manipur', '796': 'Mizoram', '797': 'Nagaland', '798': 'Nagaland', '799': 'Tripura',
  '814': 'Jharkhand', '815': 'Jharkhand', '816': 'Jharkhand', '822': 'Jharkhand', '825': 'Jharkhand', '826': 'Jharkhand',
  '827': 'Jharkhand', '828': 'Jharkhand', '829': 'Jharkhand', '831': 'Jharkhand', '832': 'Jharkhand', '833': 'Jharkhand',
  '834': 'Jharkhand', '835': 'Jharkhand',
};

const PIN_PREFIX_2: Record<string, string> = {
  '11': 'Delhi', '12': 'Haryana', '13': 'Haryana', '14': 'Punjab', '15': 'Punjab', '16': 'Punjab', '17': 'Himachal Pradesh',
  '18': 'Jammu & Kashmir', '19': 'Jammu & Kashmir', '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh',
  '23': 'Uttar Pradesh', '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh', '27': 'Uttar Pradesh',
  '28': 'Uttar Pradesh', '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan',
  '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat', '40': 'Maharashtra', '41': 'Maharashtra',
  '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra', '45': 'Madhya Pradesh', '46': 'Madhya Pradesh',
  '47': 'Madhya Pradesh', '48': 'Madhya Pradesh', '49': 'Chhattisgarh', '50': 'Telangana', '51': 'Andhra Pradesh',
  '52': 'Andhra Pradesh', '53': 'Andhra Pradesh', '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka',
  '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu', '67': 'Kerala',
  '68': 'Kerala', '69': 'Kerala', '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal',
  '74': 'West Bengal', '75': 'Odisha', '76': 'Odisha', '77': 'Odisha', '78': 'Assam', '80': 'Bihar', '81': 'Bihar',
  '82': 'Bihar', '83': 'Jharkhand', '84': 'Bihar', '85': 'Bihar',
};

const ZONE_DAYS: Record<number, [number, number]> = { 1: [2, 4], 2: [4, 6], 3: [5, 7], 4: [6, 9] };

type Result = { ok: true; place: string; state: string; charge: number; from: Date; to: Date } | { ok: false };

function stateFromPin(pin: string): string | null {
  return PIN_PREFIX_3[pin.slice(0, 3)] ?? PIN_PREFIX_2[pin.slice(0, 2)] ?? null;
}

function stateFromArea(q: string): { state: string; place: string } | null {
  const s = q.trim().toLowerCase();
  if (s.length < 3) return null;
  const st = INDIAN_STATES.find((x) => x.name.toLowerCase().includes(s));
  if (st) return { state: st.name, place: st.name };
  for (const state of INDIAN_STATES) {
    const d = getDistrictsForState(state.name).find((x) => x.toLowerCase().includes(s));
    if (d) return { state: state.name, place: `${d}, ${state.name}` };
  }
  return null;
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export default function DeliveryChecker({ freeDelivery }: { freeDelivery?: boolean }) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    let found: { state: string; place: string } | null = null;
    if (/^\d{6}$/.test(q)) {
      const st = stateFromPin(q);
      if (st) found = { state: st, place: `PIN ${q}, ${st}` };
    } else {
      found = stateFromArea(q);
    }
    const zone = found ? INDIAN_STATES.find((s) => s.name === found!.state)?.zone : undefined;
    if (!found || !zone) {
      setResult({ ok: false });
      return;
    }
    const [a, b] = ZONE_DAYS[zone];
    setResult({
      ok: true,
      place: found.place,
      state: found.state,
      charge: freeDelivery ? 0 : getShippingCharge(found.state),
      from: addDays(a),
      to: addDays(b),
    });
  };

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' });

  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-2">
        <Truck size={14} className="text-emerald-800" /> {t('deliveryCheck')}
      </span>
      <form onSubmit={check} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResult(null);
            }}
            placeholder={t('deliveryPlaceholder')}
            maxLength={60}
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1.5 transition"
        >
          <Search size={13} /> {t('deliveryCheckBtn')}
        </button>
      </form>
      {result && (
        <div
          className={`mt-2.5 rounded-lg p-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-300 ${
            result.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.ok ? (
            <div className="space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {t('deliveryAvailable')} — {result.place}
              </p>
              <p>
                {t('deliveryEta')}: <span className="font-bold">{fmt(result.from)} – {fmt(result.to)}</span>
              </p>
              <p>
                {t('shipCharge')}: <span className="font-bold">{result.charge === 0 ? t('deliveryFree') : `₹${result.charge}`}</span>
                {' • '}
                {t('deliveryCod')}
              </p>
            </div>
          ) : (
            <p className="font-semibold flex items-center gap-1.5">
              <XCircle size={14} /> {t('deliveryNotFound')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
