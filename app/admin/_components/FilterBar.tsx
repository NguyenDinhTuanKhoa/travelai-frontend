'use client';
import { ReactNode } from 'react';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  onReset?: () => void;
  rightActions?: ReactNode;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filters = [],
  onReset,
  rightActions,
}: FilterBarProps) {
  const hasFilters = filters.length > 0 || onSearchChange;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 flex-wrap">
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      )}
      {filters.map((f) => (
        <div key={f.key} className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              {f.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}
        </div>
      ))}
      {hasFilters && onReset && (
        <button
          onClick={onReset}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors font-medium"
        >
          ↺ Reset
        </button>
      )}
      {rightActions && <div className="ml-auto">{rightActions}</div>}
    </div>
  );
}
