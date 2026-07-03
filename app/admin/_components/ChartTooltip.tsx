'use client';
import { ReactNode } from 'react';

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: ReactNode;
  /** Override the heading shown at the top of the tooltip. */
  labelFormatter?: (label: ReactNode, payload: TooltipEntry[]) => ReactNode;
  /** Map a raw dataKey to a friendly series name. */
  nameMap?: Record<string, string>;
  /** Suffix appended after each value (e.g. " điểm đến"). */
  unit?: string;
}

const fmt = (v: number | string | undefined) =>
  typeof v === 'number' ? v.toLocaleString('vi-VN') : v ?? '';

export default function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  nameMap,
  unit,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const heading = labelFormatter ? labelFormatter(label, payload) : label;

  return (
    <div className="rounded-xl border border-gray-100 bg-white/90 backdrop-blur-md px-3.5 py-2.5 shadow-lg shadow-gray-900/5 ring-1 ring-black/[0.02]">
      {heading != null && heading !== '' && (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
          {heading}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const key = String(entry.dataKey ?? entry.name ?? i);
          const name = nameMap?.[key] ?? entry.name ?? key;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                style={{ backgroundColor: entry.color || '#6366f1' }}
              />
              <span className="text-xs text-gray-500">{name}</span>
              <span className="ml-auto text-sm font-bold text-gray-900 tabular-nums">
                {fmt(entry.value)}
                {unit ? <span className="ml-0.5 text-xs font-normal text-gray-400">{unit}</span> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
