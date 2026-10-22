'use client';
import React, { useState } from 'react';
import { RefreshCcw, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { submitReturnRequest } from '@/lib/supabase';

const WHATSAPP_SUPPORT_URL =
  'https://wa.me/919332376959?text=Hello%20FALAH,%20I%20have%20a%20return%2Freplacement%20request%20with%20my%20unboxing%20video';

export default function ReturnRequestModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 'wrong_cut', label: t('reasonWrongCut') },
    { value: 'wrong_fabric', label: t('reasonWrongFabric') },
    { value: 'damaged', label: t('reasonDamaged') },
    { value: 'wrong_item', label: t('reasonWrongItem') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim() || !reason) {
      setError(t('alertFill'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await submitReturnRequest({
        orderId: orderId.trim(),
        phone: phone.trim(),
        reason,
        details: details.trim(),
      });
      setDone(true);
    } catch {
      setError(t('alertFill'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <RefreshCcw size={16} className="text-emerald-800" /> {t('returnsTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <RefreshCcw size={28} className="text-emerald-700" />
            </div>
            <p className="text-sm text-gray-700 font-semibold">{t('returnThanks')}</p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 text-left leading-relaxed">
              {t('unboxingNotice')}
            </p>
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm transition"
            >
              WhatsApp (+91 9332376959)
            </a>
            <button
              onClick={onClose}
              className="w-full border border-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              {t('successAnother')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <input
              type="text"
              placeholder={t('orderId')}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
              required
            />
            <input
              type="tel"
              placeholder={t('returnPhone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
              required
            />
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
              required
            >
              <option value="">{t('returnReason')}</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <textarea
              placeholder={t('returnDetails')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 resize-none"
            />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[11px] text-amber-900 leading-relaxed">{t('unboxingNotice')}</p>
            </div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 rounded-lg text-sm transition"
            >
              {submitting ? t('processing') : t('returnSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
