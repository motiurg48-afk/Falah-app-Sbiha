'use client';
import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, Loader2, Save } from 'lucide-react';
import { loadRewardConfig, saveRewardConfig, DEFAULT_REWARD_CONFIG, type RewardConfig } from '@/lib/rewards';

type Status = { kind: 'ok' | 'err'; text: string } | null;

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition';
const btnCls =
  'inline-flex items-center justify-center gap-2 bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/50 font-bold px-4 py-2.5 rounded-lg text-sm transition disabled:opacity-50';
const labelCls = 'text-xs font-bold text-gray-700 block mb-1';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </label>
  );
}

function clampInt(v: string, min: number, max: number) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

function clampFloat(v: string, min: number, max: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

export default function RewardPointsManager() {
  const [config, setConfig] = useState<RewardConfig>({ ...DEFAULT_REWARD_CONFIG });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    loadRewardConfig().then((c) => {
      setConfig(c);
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    setStatus(null);
    setBusy(true);
    try {
      await saveRewardConfig(config);
      setStatus({ kind: 'ok', text: 'Reward points settings saved.' });
    } catch {
      setStatus({ kind: 'err', text: 'Failed to save. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0d0d0d] text-[#E8C34A] flex items-center justify-center flex-shrink-0">
          <Award size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Reward Points System</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Customers earn points on every order. Admins control the earning rate, point value, and redemption rules from here.
          </p>
        </div>
      </div>

      {!loaded ? (
        <Loader2 className="animate-spin text-gray-400" size={18} />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Toggle
              checked={config.enabled}
              onChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
              label="Enable reward points system"
            />
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
              {config.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Points earned per ₹1,000 spent</label>
              <input
                type="number"
                min={1}
                max={1000}
                className={inputCls}
                value={Math.round(config.pointsPerRsSpent * 1000)}
                onChange={(e) => setConfig((c) => ({ ...c, pointsPerRsSpent: clampInt(e.target.value, 1, 1000) / 1000 }))}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Default: 50 points → Customer earns 50 pts for every ₹1,000 spent
              </p>
            </div>
            <div>
              <label className={labelCls}>Point value (₹ per point)</label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                max={10}
                className={inputCls}
                value={config.pointValueInRs}
                onChange={(e) => setConfig((c) => ({ ...c, pointValueInRs: clampFloat(e.target.value, 0.1, 10) }))}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Default: ₹0.25 → 100 points = ₹25 discount
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Minimum cart total to redeem points (₹)</label>
              <input
                type="number"
                min={100}
                max={50000}
                className={inputCls}
                value={config.minCartTotalToRedeem}
                onChange={(e) => setConfig((c) => ({ ...c, minCartTotalToRedeem: clampInt(e.target.value, 100, 50000) }))}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Default: ₹2,000 → Customers can only use points when their order subtotal reaches this amount
              </p>
            </div>
          </div>

          {config.enabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-bold text-amber-900">How it works</p>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                <li>A ₹{Math.round(1 / config.pointsPerRsSpent).toLocaleString()} spend earns {Math.round(config.pointsPerRsSpent * 1000)} points per ₹1,000</li>
                <li>Each point is worth ₹{config.pointValueInRs}</li>
                <li>1000 points = ₹{Math.round(1000 * config.pointValueInRs).toLocaleString()} discount during checkout</li>
                <li>Minimum order of ₹{config.minCartTotalToRedeem.toLocaleString()} required to redeem points</li>
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={save} disabled={busy} className={btnCls}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Settings
            </button>
            {status && (
              <p className={`text-xs font-medium flex items-center gap-1.5 ${status.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
                {status.kind === 'ok' && <CheckCircle size={13} />}
                {status.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}