'use client';
import React, { useState } from 'react';
import { X, LogIn, Phone, KeyRound, ArrowRight, Loader2, User } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useLang } from '@/lib/i18n';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition';
const btnCls = 'w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-2.5 rounded-lg text-sm transition';

export default function CustomerLoginModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { sendOtp, verifyOtp } = useCustomerAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    const res = await sendOtp(digits);
    setLoading(false);
    if (res.success) {
      setStep('otp');
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    const digits = phone.replace(/[^0-9]/g, '');
    const res = await verifyOtp(digits, otp);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Invalid OTP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <LogIn size={17} className="text-emerald-800" /> {step === 'phone' ? 'Login / Sign Up' : 'Verify OTP'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <p className="text-xs text-gray-500">Enter your phone number to receive a 6-digit OTP.</p>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 10-digit phone number"
                  className={`${inputCls} pl-9`}
                  maxLength={10}
                  required
                />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <p className="text-xs text-gray-500">
                We sent a 6-digit code to <span className="font-bold text-gray-800">{phone}</span>
              </p>
              <button type="button" onClick={() => setStep('phone')} className="text-xs text-emerald-700 hover:underline font-medium">
                Change phone number
              </button>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className={`${inputCls} pl-9 text-center text-lg tracking-[0.5em] font-bold`}
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                Verify & Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}