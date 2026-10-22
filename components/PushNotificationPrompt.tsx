'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const listenedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    const dismissedAt = localStorage.getItem('falah_notif_prompt_dismissed');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    const timer = setTimeout(() => setShowPrompt(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (listenedRef.current) return;
    listenedRef.current = true;

    const channel = supabase
      .channel('push-broadcasts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'push_notification_broadcasts' },
        (payload) => {
          const row = payload.new as { title: string; body: string } | undefined;
          if (!row) return;
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(row.title, { body: row.body });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!showPrompt || dismissed) return null;

  const enable = () => {
    Notification.requestPermission().then(() => {
      setShowPrompt(false);
      localStorage.setItem('falah_notif_prompt_dismissed', String(Date.now()));
    });
  };

  const dismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('falah_notif_prompt_dismissed', String(Date.now()));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 bg-white border border-amber-200 rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Bell size={18} className="text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Stay updated!</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Get notified about new arrivals, restocks, and exclusive offers.
          </p>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={enable}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 rounded-md transition"
            >
              Allow
            </button>
            <button
              onClick={dismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-1.5 rounded-md transition"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-0.5"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}