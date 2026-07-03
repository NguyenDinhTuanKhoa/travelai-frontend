'use client';
import { ReactNode } from 'react';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: ReactNode;
}

export default function BulkActionBar({ count, onClear, actions }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-[slideUp_0.2s_ease]">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-800 px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-r from-sky-500 to-violet-500 rounded-lg flex items-center justify-center text-xs font-bold">
            {count}
          </div>
          <span className="text-sm font-medium">đã chọn</span>
        </div>
        <div className="h-6 w-px bg-gray-700" />
        <div className="flex items-center gap-2">{actions}</div>
        <div className="h-6 w-px bg-gray-700" />
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Bỏ chọn
        </button>
      </div>
    </div>
  );
}
