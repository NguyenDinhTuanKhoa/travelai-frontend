'use client';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const styleMap: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: '✅' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '⚠️' },
  info: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', icon: 'ℹ️' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️' },
};

// Global toast store (singleton)
let setToastsExternal: ((toasts: ToastMessage[]) => void) | null = null;
let currentToasts: ToastMessage[] = [];

export const toast = {
  show(type: ToastType, message: string, duration = 3000) {
    const id = `${Date.now()}-${Math.random()}`;
    currentToasts = [...currentToasts, { id, type, message }];
    setToastsExternal?.(currentToasts);
    setTimeout(() => toast.dismiss(id), duration);
  },
  success(msg: string, duration?: number) { toast.show('success', msg, duration); },
  error(msg: string, duration?: number) { toast.show('error', msg, duration); },
  info(msg: string, duration?: number) { toast.show('info', msg, duration); },
  warning(msg: string, duration?: number) { toast.show('warning', msg, duration); },
  dismiss(id: string) {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    setToastsExternal?.(currentToasts);
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setToastsExternal = setToasts;
    return () => { setToastsExternal = null; };
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const s = styleMap[t.type];
        return (
          <div
            key={t.id}
            className={`${s.bg} ${s.border} ${s.text} border rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3 animate-[slideInRight_0.2s_ease]`}
          >
            <span className="text-lg shrink-0">{s.icon}</span>
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-current opacity-50 hover:opacity-100 text-sm transition-opacity"
            >✕</button>
          </div>
        );
      })}
    </div>
  );
}
