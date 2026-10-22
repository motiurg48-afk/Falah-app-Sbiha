'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang, type Lang } from '@/lib/i18n';

const STORAGE_PREFIX = 'falah_tr_';

function cacheKey(text: string, lang: Lang) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${STORAGE_PREFIX}${lang}_${text.length}_${(h >>> 0).toString(36)}`;
}

function readCache(text: string, lang: Lang): string | null {
  try {
    return localStorage.getItem(cacheKey(text, lang));
  } catch {
    return null;
  }
}

async function requestTranslation(text: string, lang: Lang): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('translate-text', { body: { texts: [text], lang } });
  const out = data?.translations?.[0];
  if (error || typeof out !== 'string' || !out) return null;
  try {
    localStorage.setItem(cacheKey(text, lang), out);
  } catch {}
  return out;
}

export function useTranslatedText(text: string | null | undefined): { text: string; translating: boolean } {
  const { lang } = useLang();
  const source = (text ?? '').trim();
  const [result, setResult] = useState<{ key: string; value: string } | null>(null);
  const key = `${lang}|${source}`;

  useEffect(() => {
    if (!source) return;
    const cached = readCache(source, lang);
    if (cached) {
      setResult({ key, value: cached });
      return;
    }
    let cancelled = false;
    requestTranslation(source, lang).then((out) => {
      if (!cancelled) setResult({ key, value: out ?? source });
    });
    return () => {
      cancelled = true;
    };
  }, [key, source, lang]);

  if (!source) return { text: '', translating: false };
  if (result?.key === key) return { text: result.value, translating: false };
  return { text: source, translating: true };
}
