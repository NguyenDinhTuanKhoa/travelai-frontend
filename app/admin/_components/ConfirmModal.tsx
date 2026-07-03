'use client';
import { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md animate-[fadeInScale_0.2s_ease]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${danger ? 'bg-red-50' : 'bg-sky-50'}`}>
              {danger ? '⚠️' : '❓'}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <div className="text-sm text-gray-600 mt-1.5">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-white rounded-xl transition-all font-semibold text-sm hover:shadow-lg disabled:opacity-50 flex items-center gap-2 ${
              danger
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-500/30'
                : 'bg-gradient-to-r from-sky-500 to-violet-500 hover:shadow-violet-500/30'
            }`}
          >
            {loading && <span className="animate-spin">⏳</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
