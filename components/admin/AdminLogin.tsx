'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'loading' | 'signin' | 'setup';

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

export default function AdminLogin({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<Mode>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.rpc('admin_exists').then(({ data, error: err }) => {
      if (err) {
        setMode('signin');
        return;
      }
      setMode(data === true ? 'signin' : 'setup');
    });
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        setError(err.message.toLowerCase().includes('invalid') ? 'ইমেইল বা পাসওয়ার্ড ভুল।' : 'লগইন করা যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      if (!(await checkIsAdmin())) {
        await supabase.auth.signOut();
        setError('এই অ্যাকাউন্টের অ্যাডমিন অ্যাক্সেস নেই।');
        return;
      }
      onAuthed();
    } catch {
      setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirm) {
      setError('দুটি পাসওয়ার্ড মিলছে না।');
      return;
    }
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) {
        setError(err.message.toLowerCase().includes('registered') ? 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।' : 'অ্যাকাউন্ট তৈরি করা যায়নি।');
        return;
      }
      if (!data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInErr) {
          setError('অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু লগইন করা যায়নি।');
          return;
        }
      }
      const { data: claimed, error: claimErr } = await supabase.rpc('claim_first_admin');
      if (claimErr || claimed !== true) {
        await supabase.auth.signOut();
        setError('অ্যাডমিন আগেই সেটআপ করা হয়েছে। লগইন করুন।');
        setMode('signin');
        return;
      }
      onAuthed();
    } catch {
      setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full bg-[#141414] border border-[#D4AF37]/25 text-[#F3E7BE] placeholder:text-gray-500 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1f1a0b_0%,_#0a0a0a_60%)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#0f0f0f] border border-[#D4AF37]/30 rounded-2xl shadow-[0_20px_60px_-20px_rgba(212,175,55,0.35)] p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[#F3D77A] via-[#D4AF37] to-[#9C7A1C] p-[2px] mb-3">
            <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center text-[#E8C34A]">
              {mode === 'setup' ? <ShieldCheck size={24} /> : <Lock size={22} />}
            </div>
          </div>
          <h1 className="text-xl font-serif font-bold falah-gold-text">FALAH Admin</h1>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            {mode === 'setup'
              ? 'প্রথমবার সেটআপ: আপনার অ্যাডমিন ইমেইল ও পাসওয়ার্ড তৈরি করুন'
              : 'অ্যাডমিন প্যানেলে প্রবেশ করতে লগইন করুন'}
          </p>
        </div>

        {mode === 'loading' ? (
          <div className="flex justify-center py-8 text-[#D4AF37]">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <form onSubmit={mode === 'setup' ? handleSetup : handleSignIn} className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className={inputCls}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/70" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড"
                className={`${inputCls} pr-10`}
                autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#E8C34A]"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === 'setup' && (
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/70" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  className={inputCls}
                  autoComplete="new-password"
                />
              </div>
            )}
            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#E8C34A] hover:to-[#D4AF37] text-[#0d0d0d] font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === 'setup' ? 'অ্যাডমিন অ্যাকাউন্ট তৈরি করুন' : 'লগইন'}
            </button>
            <a href="/" className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#E8C34A] pt-2 transition">
              <ArrowLeft size={12} /> স্টোরে ফিরে যান
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
