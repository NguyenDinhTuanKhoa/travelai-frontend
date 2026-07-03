'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export type DrillDownKind = 'users' | 'reviews';

export interface DrillDownInfo {
  kind: DrillDownKind;
  date: string;
  count: number;
}

interface Props {
  info: DrillDownInfo | null;
  onClose: () => void;
}

const META: Record<DrillDownKind, { icon: string; title: string; unit: string; managePath: string; manageLabel: string }> = {
  users: {
    icon: '👥',
    title: 'Người dùng đăng ký',
    unit: 'người dùng',
    managePath: '/admin/users',
    manageLabel: 'Mở danh sách người dùng',
  },
  reviews: {
    icon: '⭐',
    title: 'Đánh giá mới',
    unit: 'đánh giá',
    managePath: '/admin/reviews',
    manageLabel: 'Mở danh sách đánh giá',
  },
};

function formatVN(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function dayRange(date: string) {
  const start = new Date(date + 'T00:00:00');
  const end = new Date(date + 'T23:59:59.999');
  return { from: start.toISOString(), to: end.toISOString() };
}

export default function ChartDrillDownModal({ info, onClose }: Props) {
  useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info, onClose]);

  if (!info) return null;
  const meta = META[info.kind];
  const { from, to } = dayRange(info.date);
  const href = `${meta.managePath}?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-[fadeInScale_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-2xl shrink-0">
              {meta.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{meta.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{formatVN(info.date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none p-1 -m-1"
            aria-label="Đóng"
          >✕</button>
        </div>

        <div className="px-6 py-5">
          <div className="bg-gradient-to-br from-violet-50 to-sky-50 border border-violet-100 rounded-2xl p-5 text-center">
            <p className="text-4xl font-bold text-gray-900">{info.count.toLocaleString('vi-VN')}</p>
            <p className="text-sm text-gray-600 mt-1">{meta.unit} trong ngày này</p>
          </div>

          {info.count === 0 ? (
            <p className="text-xs text-gray-500 text-center mt-4">Không có dữ liệu để xem thêm.</p>
          ) : (
            <Link
              href={href}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-600 hover:to-violet-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-violet-500/20 transition-all"
              onClick={onClose}
            >
              <span>{meta.manageLabel}</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
