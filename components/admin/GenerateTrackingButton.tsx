'use client';
import React, { useState } from 'react';
import { Truck, Loader2, CheckCircle, X } from 'lucide-react';

type CourierOption = { slug: string; label: string };

const COURIER_OPTIONS: CourierOption[] = [
  { slug: 'delhivery', label: 'Delhivery' },
  { slug: 'shiprocket', label: 'Shiprocket' },
  { slug: 'steadfast', label: 'Steadfast' },
  { slug: 'dtdc', label: 'DTDC' },
  { slug: 'bluedart', label: 'Blue Dart' },
];

export default function GenerateTrackingButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ awb: string; courier: string; url: string } | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-shipment`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courier_slug: selected, order_id: orderId }),
      });
      const body = await res.json();
      if (!res.ok || body.error) {
        setError(body.error ?? 'Failed to create shipment');
        return;
      }
      setResult({ awb: body.awb_number, courier: body.courier_name, url: body.tracking_url });
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[10px] space-y-1">
        <div className="flex items-center gap-1 text-emerald-800 font-bold">
          <CheckCircle size={11} /> Tracking Generated
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">{COURIER_OPTIONS.find((c) => c.slug === result.courier)?.label}:</span> {result.awb}
        </div>
        {result.url && (
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline block">
            Open Tracking Link
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg py-1.5 px-3 hover:bg-amber-100 transition"
        >
          <Truck size={12} /> Generate Tracking
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900">Select Courier</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-amber-300 rounded-md px-2 py-1.5 text-[11px] font-semibold bg-white focus:outline-none focus:border-amber-600"
          >
            <option value="">-- Choose --</option>
            {COURIER_OPTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={loading || !selected}
            className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-[11px] font-bold py-1.5 rounded-md transition"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
            {loading ? 'Generating...' : 'Generate AWB & Mark Shipped'}
          </button>
          {error && <p className="text-[10px] text-red-600 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}