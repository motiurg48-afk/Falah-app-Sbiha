'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle, KeyRound, Loader2, Mail, Megaphone, UserCog } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/components/admin/AdminLogin';
import { fetchSetting, saveSetting } from '@/lib/catalog';

type Status = { kind: 'ok' | 'err'; text: string } | null;

function Notice({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={`text-xs font-medium flex items-center gap-1.5 ${status.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
      {status.kind === 'ok' && <CheckCircle size={13} />}
      {status.text}
    </p>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8962E] focus:ring-2 focus:ring-[#D4AF37]/20 transition';
const btnCls =
  'inline-flex items-center justify-center gap-2 bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/50 font-bold px-4 py-2.5 rounded-lg text-sm transition disabled:opacity-50';

function Card({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0d0d0d] text-[#E8C34A] flex items-center justify-center flex-shrink-0">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

async function verifyCurrentPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export default function AccountSettings() {
  const [currentEmail, setCurrentEmail] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<Status>(null);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>(null);

  const [announce, setAnnounce] = useState('');
  const [announceLoaded, setAnnounceLoaded] = useState(false);
  const [announceBusy, setAnnounceBusy] = useState(false);
  const [announceStatus, setAnnounceStatus] = useState<Status>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentEmail(data.user?.email ?? ''));
    fetchSetting('announcement_text')
      .then((v) => setAnnounce(v ?? ''))
      .catch(() => setAnnounceStatus({ kind: 'err', text: 'বর্তমান লেখা লোড করা যায়নি।' }))
      .finally(() => setAnnounceLoaded(true));
  }, []);

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    const target = newEmail.trim().toLowerCase();
    if (!target || target === currentEmail.toLowerCase()) {
      setEmailStatus({ kind: 'err', text: 'নতুন একটি ইমেইল দিন।' });
      return;
    }
    setEmailBusy(true);
    try {
      if (!(await verifyCurrentPassword(currentEmail, emailPw))) {
        setEmailStatus({ kind: 'err', text: 'বর্তমান পাসওয়ার্ড ভুল।' });
        return;
      }
      const { data, error } = await supabase.auth.updateUser({ email: target });
      if (error) {
        setEmailStatus({ kind: 'err', text: error.message.toLowerCase().includes('already') ? 'এই ইমেইলটি অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে।' : 'ইমেইল পরিবর্তন করা যায়নি।' });
        return;
      }
      const applied = data.user?.email?.toLowerCase() === target;
      if (applied) setCurrentEmail(target);
      setEmailStatus({
        kind: 'ok',
        text: applied ? 'ইমেইল পরিবর্তন হয়েছে। পরের বার নতুন ইমেইল দিয়ে লগইন করুন।' : 'নিশ্চিতকরণ লিংক পাঠানো হয়েছে। ইমেইল চেক করে কনফার্ম করুন।',
      });
      setNewEmail('');
      setEmailPw('');
    } finally {
      setEmailBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    if (newPw.length < 8) {
      setPwStatus({ kind: 'err', text: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwStatus({ kind: 'err', text: 'নতুন পাসওয়ার্ড দুটি মিলছে না।' });
      return;
    }
    setPwBusy(true);
    try {
      if (!(await verifyCurrentPassword(currentEmail, curPw))) {
        setPwStatus({ kind: 'err', text: 'বর্তমান পাসওয়ার্ড ভুল।' });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        setPwStatus({ kind: 'err', text: error.message.toLowerCase().includes('different') ? 'নতুন পাসওয়ার্ড আগেরটির থেকে আলাদা হতে হবে।' : 'পাসওয়ার্ড পরিবর্তন করা যায়নি।' });
        return;
      }
      setPwStatus({ kind: 'ok', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।' });
      setCurPw('');
      setNewPw('');
      setConfirmPw('');
    } finally {
      setPwBusy(false);
    }
  };

  const saveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnounceStatus(null);
    setAnnounceBusy(true);
    try {
      await saveSetting('announcement_text', announce.trim());
      setAnnounceStatus({ kind: 'ok', text: announce.trim() ? 'অ্যানাউন্সমেন্ট আপডেট হয়েছে — স্টোরে এখনই দেখা যাবে।' : 'ডিফল্ট লেখা ফিরিয়ে আনা হয়েছে।' });
    } catch {
      setAnnounceStatus({ kind: 'err', text: 'সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setAnnounceBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">সেটিংস</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          লগইন করা আছেন: <span className="font-semibold text-gray-800">{currentEmail || '...'}</span>
        </p>
      </div>

      <Card
        icon={<Megaphone size={18} />}
        title="হেডার অ্যানাউন্সমেন্ট বার"
        sub="স্টোরের একদম উপরের কালো বারে যে লেখা দেখায়। খালি রাখলে ডিফল্ট লেখা দেখাবে।"
      >
        <form onSubmit={saveAnnouncement} className="space-y-3">
          <div className="rounded-lg bg-[#111111] text-[#E8D48B] text-xs text-center py-2.5 px-4 border border-[#D4AF37]/20 min-h-[38px]">
            {announce.trim() || 'ডিফল্ট: সমগ্র ভারতে হোম ডেলিভারি সুবিধা | পাইকারি ও কাস্টম অর্ডার গ্রহণ করা হয়'}
          </div>
          <textarea
            value={announce}
            onChange={(e) => setAnnounce(e.target.value)}
            maxLength={200}
            rows={2}
            disabled={!announceLoaded}
            placeholder="যেমন: ঈদ অফার! সব অর্ডারে ১০% ছাড় — কোড EID10"
            className={`${inputCls} resize-none`}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-gray-400">{announce.length}/200</span>
            <button type="submit" disabled={announceBusy || !announceLoaded} className={btnCls}>
              {announceBusy && <Loader2 size={14} className="animate-spin" />} সেভ করুন
            </button>
          </div>
          <Notice status={announceStatus} />
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card icon={<Mail size={18} />} title="ইমেইল পরিবর্তন" sub="অ্যাডমিন লগইনের ইমেইল ঠিকানা বদলান।">
          <form onSubmit={changeEmail} className="space-y-3">
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="নতুন ইমেইল" className={inputCls} autoComplete="email" />
            <input type="password" required value={emailPw} onChange={(e) => setEmailPw(e.target.value)} placeholder="বর্তমান পাসওয়ার্ড" className={inputCls} autoComplete="current-password" />
            <button type="submit" disabled={emailBusy} className={`${btnCls} w-full`}>
              {emailBusy ? <Loader2 size={14} className="animate-spin" /> : <UserCog size={14} />} ইমেইল আপডেট করুন
            </button>
            <Notice status={emailStatus} />
          </form>
        </Card>

        <Card icon={<KeyRound size={18} />} title="পাসওয়ার্ড পরিবর্তন" sub="নিরাপত্তার জন্য কমপক্ষে ৮ অক্ষরের শক্ত পাসওয়ার্ড ব্যবহার করুন।">
          <form onSubmit={changePassword} className="space-y-3">
            <input type="password" required value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="বর্তমান পাসওয়ার্ড" className={inputCls} autoComplete="current-password" />
            <input type="password" required value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="নতুন পাসওয়ার্ড" className={inputCls} autoComplete="new-password" />
            <input type="password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="নতুন পাসওয়ার্ড আবার লিখুন" className={inputCls} autoComplete="new-password" />
            <button type="submit" disabled={pwBusy} className={`${btnCls} w-full`}>
              {pwBusy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} পাসওয়ার্ড আপডেট করুন
            </button>
            <Notice status={pwStatus} />
          </form>
        </Card>
      </div>
    </section>
  );
}
