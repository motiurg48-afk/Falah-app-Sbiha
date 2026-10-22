'use client';
import React, { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { hasActiveUiLayer, consumeSuppressNextPop } from '@/lib/modal-layer';

const TRAP_KEY = 'falah_exit_trap';

export default function ExitConfirmDialog() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
    if (!isMobile) return;

    let installed = false;
    try {
      const flag = sessionStorage.getItem(TRAP_KEY);
      if (!flag) {
        window.history.pushState({ falahTrap: true }, '');
        sessionStorage.setItem(TRAP_KEY, '1');
      }
      installed = true;
    } catch {
      installed = false;
    }
    if (!installed) return;

    const onPop = (e: PopStateEvent) => {
      if (hasActiveUiLayer() || consumeSuppressNextPop()) return;
      e.preventDefault();
      setShow(true);
      window.history.pushState({ falahTrap: true }, '');
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (show) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onBeforeUnload);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onBeforeUnload);
    };
  }, [show]);

  const stay = () => setShow(false);

  const exit = () => {
    setShow(false);
    try {
      sessionStorage.removeItem(TRAP_KEY);
    } catch {}
    window.close();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-[#0d0d0d] to-[#1c1c1c] px-6 pt-6 pb-8 text-center relative">
          <button
            onClick={stay}
            className="absolute top-3 right-3 text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
            aria-label="Stay"
          >
            <X size={18} />
          </button>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E8C34A]/15 border border-[#D4AF37]/40 flex items-center justify-center mb-3">
            <AlertTriangle size={26} className="text-[#E8C34A]" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t('exitTitle')}</h2>
          <p className="text-xs text-white/60 mt-1">{t('exitSub')}</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={stay}
            className="flex items-center justify-center gap-1.5 bg-[#0d0d0d] hover:bg-[#262626] text-[#E8C34A] font-bold py-3 rounded-xl text-sm transition border border-[#D4AF37]/40"
          >
            <X size={15} /> {t('exitStay')}
          </button>
          <button
            onClick={exit}
            className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition"
          >
            <LogOut size={15} /> {t('exitExit')}
          </button>
        </div>
      </div>
    </div>
  );
}
