'use client';
import React from 'react';
import { useLang } from '@/lib/i18n';
import { useTranslatedText } from '@/lib/translate';

export default function TranslatedText({
  text,
  fallback,
  className = '',
}: {
  text: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const { lang } = useLang();
  const { text: shown, translating } = useTranslatedText(text);
  return (
    <p
      dir={lang === 'ur' ? 'rtl' : undefined}
      className={`${className} whitespace-pre-line transition-opacity duration-300 ${translating ? 'opacity-60 animate-pulse' : 'opacity-100'}`}
    >
      {shown || fallback}
    </p>
  );
}
