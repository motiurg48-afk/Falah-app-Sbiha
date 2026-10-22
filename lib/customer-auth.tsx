'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type CustomerSession = { phone: string; token: string };

type AuthContextType = {
  session: CustomerSession | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const Ctx = createContext<AuthContextType>({
  session: null,
  loading: true,
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  logout: () => {},
});

const SESSION_KEY = 'falah_customer_session';

function loadSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as CustomerSession;
    if (!s.phone || !s.token) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: CustomerSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

async function callFn(name: string, body: Record<string, unknown>) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = loadSession();
    if (s) {
      (async () => {
        try {
          const { data } = await supabase.from('customer_sessions').select('phone').eq('token', s.token).gte('expires_at', new Date().toISOString()).limit(1);
          if (data && data.length > 0) setSession(s);
          else saveSession(null);
        } catch {
          saveSession(null);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const json = await callFn('send-otp', { phone });
    if (json.success) return { success: true, otp: json.otp };
    return { success: false, error: json.error || 'Failed to send OTP' };
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const json = await callFn('verify-otp', { phone, otp });
    if (json.success) {
      const s = { phone: json.phone, token: json.token };
      saveSession(s);
      setSession(s);
      return { success: true };
    }
    return { success: false, error: json.error || 'Invalid OTP' };
  }, []);

  const logout = useCallback(() => {
    if (session) {
      supabase.from('customer_sessions').delete().eq('token', session.token).then(() => {});
    }
    saveSession(null);
    setSession(null);
  }, [session]);

  return <Ctx.Provider value={{ session, loading, sendOtp, verifyOtp, logout }}>{children}</Ctx.Provider>;
}

export function useCustomerAuth() {
  return useContext(Ctx);
}