'use client';
import React, { useEffect, useState } from 'react';
import { Bell, Send, Loader2, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Broadcast = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export default function PushBroadcastManager() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase
      .from('push_notification_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setBroadcasts(data as Broadcast[]);
      });
  }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSent(false);
    try {
      const { error } = await supabase.from('push_notification_broadcasts').insert({
        title: title.trim(),
        body: body.trim(),
      });
      if (error) throw error;
      setSent(true);
      setTitle('');
      setBody('');
      const { data } = await supabase
        .from('push_notification_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setBroadcasts(data as Broadcast[]);
      setTimeout(() => setSent(false), 3000);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Bell size={18} /> পুশ নোটিফিকেশন ব্রডকাস্ট
      </h2>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">টাইটেল</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="নতুন কালেকশন এসেছে!"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">মেসেজ</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="শীতের নতুন আবায়া ও হিজাব দেখুন আমাদের ওয়েবসাইটে"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : sent ? <CheckCircle size={14} /> : <Send size={14} />}
            {sent ? 'পাঠানো হয়েছে!' : 'সবাইকে পাঠান'}
          </button>
        </div>
      </div>

      {broadcasts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          এখনো কোনো নোটিফিকেশন পাঠানো হয়নি।
        </div>
      ) : (
        <div className="space-y-2">
          {broadcasts.map((b) => (
            <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                <Bell size={14} className="text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{b.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{b.body}</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(b.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}