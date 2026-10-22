'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageCircle, Headset } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { fetchFaqs, type Faq } from '@/lib/supabase';
import { answerQuery, findProductInText, type ProductInfo } from '@/lib/matiur-brain';
import { supabase } from '@/lib/supabase';
import catalogJson from '@/data/products.json';

const WHATSAPP = '919332376959';
const WA_URL = `https://wa.me/${WHATSAPP}?text=Hello%20FALAH,%20I%20need%20help`;

type Msg = { from: 'bot' | 'user'; text: string };

function getSessionId(): string {
  try {
    let id = localStorage.getItem('falah_chat_session');
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('falah_chat_session', id);
    }
    return id;
  } catch {
    return 'sess-anon';
  }
}

function logChat(question: string, answer: string | null, source: 'gemini' | 'fallback') {
  supabase
    .from('chat_logs')
    .insert({ session_id: getSessionId(), question, answer, source })
    .then(({ error }) => {
      if (error) console.error('chat log insert failed:', error.message);
    });
}

function renderRich(text: string) {
  const cleaned = text.replace(/^\s*[*-]\s+/gm, '• ');
  return cleaned.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

type GeminiTurn = { role: 'user' | 'model'; text: string };

async function askGemini(message: string, history: Msg[]): Promise<string> {
  const geminiHistory: GeminiTurn[] = history
    .slice(-8)
    .filter((m) => m.text.trim())
    .map((m) => ({ role: m.from === 'user' ? 'user' : 'model', text: m.text }));
  const { data, error } = await supabase.functions.invoke('motiur-chat', {
    body: { message, history: geminiHistory },
  });
  if (error) throw error;
  if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('Empty reply');
  }
  return data.reply.trim();
}

export default function FloatingWidgets({ catalog }: { catalog?: ProductInfo[] }) {
  const { t } = useLang();
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<ProductInfo[]>([]);
  const lastProductRef = useRef<string | null>(null);

  useEffect(() => {
    fetchFaqs()
      .then(setFaqs)
      .catch(() => setFaqs([]));
  }, []);

  useEffect(() => {
    catalogRef.current = catalog && catalog.length > 0 ? catalog : (catalogJson as unknown as ProductInfo[]);
  }, [catalog]);

  useEffect(() => {
    if (chatOpen && msgs.length === 0) {
      setMsgs([{ from: 'bot', text: t('chatGreeting') }]);
    }
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs]);

  const answerFor = (q: string): string => {
    const s = q.toLowerCase();

    // Layer 1 — Admin Panel FAQ database (exact keyword/question match)
    let adminAnswer: string | undefined;
    for (const f of faqs) {
      const haystacks = [f.question.toLowerCase(), ...(f.keywords ?? '').toLowerCase().split(',').map((k) => k.trim())];
      if (haystacks.filter(Boolean).some((h) => h && s.includes(h))) {
        adminAnswer = f.answer;
        break;
      }
    }

    // Layer 2 — Matiur's own multi-lingual knowledge brain
    return answerQuery(q, adminAnswer, {
      products: catalogRef.current,
      lastProduct: lastProductRef.current,
    });
  };

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setMsgs((m) => [...m, { from: 'user', text: q }]);
    setInput('');
    setThinking(true);

    const mentioned = findProductInText(q, catalogRef.current);
    if (mentioned) lastProductRef.current = mentioned.title ?? null;

    const historyBefore = msgs;
    setMsgs((m) => [...m]);

    askGemini(q, historyBefore)
      .then((reply) => {
        setMsgs((m) => [...m, { from: 'bot', text: reply }]);
        logChat(q, reply, 'gemini');
      })
      .catch(() => {
        // Gemini unavailable — fall back to the offline keyword brain.
        const fallbackReply = answerFor(q);
        setMsgs((m) => [...m, { from: 'bot', text: fallbackReply }]);
        logChat(q, fallbackReply, 'fallback');
      })
      .finally(() => setThinking(false));
  };

  const quick = [t('chatQ1'), t('chatQ2'), t('chatQ3'), t('chatQ4'), t('chatQ5')];

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2.5">
      {chatOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[300px] sm:w-[340px] overflow-hidden flex flex-col" style={{ height: '430px' }}>
          <div className="bg-gradient-to-r from-[#0d0d0d] to-[#1a1608] text-white px-4 py-3 flex justify-between items-center border-b border-[#D4AF37]/40">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#F3D77A] via-[#D4AF37] to-[#9C7A1C] p-[1.5px] shadow-[0_0_12px_-2px_rgba(212,175,55,0.6)]">
                <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center text-[#E8C34A]">
                  <Headset size={17} strokeWidth={2} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-[#0d0d0d] rounded-full" />
              </div>
              <div>
                <span className="text-sm font-bold block leading-tight text-[#F3E7BE]">{t('chatTitle')}</span>
                <span className="text-[9px] text-[#D4AF37] tracking-wide">FALAH Customer Care • Online</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-[#D4AF37]/80 hover:text-[#FFE066] transition" aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed whitespace-pre-wrap ${
                  m.from === 'bot'
                    ? 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                    : 'bg-[#141414] text-[#F3E7BE] border border-[#D4AF37]/40 rounded-tr-none ml-auto'
                }`}
              >
                {m.from === 'bot' ? renderRich(m.text) : m.text}
              </div>
            ))}
            {thinking && (
              <div className="max-w-[85%] bg-white border border-gray-200 rounded-xl rounded-tl-none shadow-sm px-3 py-2.5 flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          <div className="px-2.5 pt-1.5 pb-2 bg-white border-t border-gray-100">
            <div className="flex gap-1.5 overflow-x-auto pb-1.5" style={{ scrollbarWidth: 'none' }}>
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="flex-shrink-0 text-[10px] font-bold bg-[#FBF6E6] text-[#6b5410] border border-[#D4AF37]/50 px-2.5 py-1 rounded-full hover:bg-[#F5EBC8] transition whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 mb-2 w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2 rounded-lg transition"
            >
              <MessageCircle size={13} /> {t('chatHuman')}
            </a>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder={t('chatPlaceholder')}
                className="flex-1 border border-gray-200 rounded-full px-3.5 py-2 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                onClick={() => send(input)}
                className="bg-[#0d0d0d] hover:bg-[#1f1f1f] text-[#E8C34A] border border-[#D4AF37]/60 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 transition"
                aria-label={t('chatSend')}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setChatOpen((s) => !s)}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-[#F3D77A] via-[#D4AF37] to-[#9C7A1C] p-[2px] shadow-[0_8px_24px_-6px_rgba(212,175,55,0.65)] transition hover:scale-105"
        aria-label={t('chatTitle')}
      >
        <span className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center text-[#E8C34A] group-hover:text-[#FFE066] transition">
          {chatOpen ? <X size={22} /> : <Headset size={24} strokeWidth={1.9} />}
        </span>
      </button>

      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-xl flex items-center justify-center transition hover:scale-105 relative"
        aria-label="WhatsApp"
      >
        <MessageCircle size={22} />
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      </a>
    </div>
  );
}
