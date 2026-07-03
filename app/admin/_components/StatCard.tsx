'use client';
import { ReactNode } from 'react';
import Sparkline from './Sparkline';

type Accent = 'sky' | 'violet' | 'emerald' | 'orange' | 'rose';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: number; // % change vs last week (omit to hide the trend badge)
  hint?: string; // neutral caption shown when there is no trend
  sparkData?: number[]; // optional mini time-series
  accent?: Accent;
}

const ACCENTS: Record<Accent, { grad: string; spark: string; soft: string }> = {
  sky: { grad: 'from-sky-500 to-blue-600', spark: '#0ea5e9', soft: 'bg-sky-50 text-sky-600' },
  violet: { grad: 'from-violet-500 to-purple-600', spark: '#8b5cf6', soft: 'bg-violet-50 text-violet-600' },
  emerald: { grad: 'from-emerald-500 to-green-600', spark: '#10b981', soft: 'bg-emerald-50 text-emerald-600' },
  orange: { grad: 'from-amber-500 to-orange-600', spark: '#f59e0b', soft: 'bg-orange-50 text-orange-600' },
  rose: { grad: 'from-rose-500 to-pink-600', spark: '#f43f5e', soft: 'bg-rose-50 text-rose-600' },
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  hint,
  sparkData,
  accent = 'sky',
}: StatCardProps) {
  const a = ACCENTS[accent];
  const hasTrend = typeof trend === 'number';
  const up = (trend ?? 0) >= 0;
  const displayValue = typeof value === 'number' ? value.toLocaleString('vi-VN') : value;

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:shadow-gray-900/5 hover:-translate-y-0.5">
      {/* subtle accent glow */}
      <div className={`pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${a.grad} opacity-[0.07] blur-2xl group-hover:opacity-15 transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold text-gray-800 mt-2 tabular-nums">{displayValue}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.grad} flex items-center justify-center text-xl shrink-0 shadow-lg shadow-gray-900/10`}>
          {icon}
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        {hasTrend ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {up ? '▲' : '▼'} {Math.abs(trend!)}%
          </span>
        ) : (
          <span className="text-xs text-gray-400">{hint ?? ' '}</span>
        )}
        {hasTrend && <span className="text-xs text-gray-400">so với tuần trước</span>}
      </div>

      {sparkData && sparkData.length > 0 && (
        <div className="relative mt-3 -mx-1 -mb-1">
          <Sparkline data={sparkData} color={a.spark} height={36} />
        </div>
      )}
    </div>
  );
}
