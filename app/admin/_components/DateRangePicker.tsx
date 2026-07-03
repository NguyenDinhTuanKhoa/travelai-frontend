'use client';

export interface DateRangePickerProps {
  value: number;
  onChange: (days: number) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
];

export default function DateRangePicker({ value, onChange, disabled }: DateRangePickerProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
      {PRESETS.map((p) => {
        const active = value === p.days;
        return (
          <button
            key={p.days}
            type="button"
            onClick={() => onChange(p.days)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow shadow-violet-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-violet-600'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
