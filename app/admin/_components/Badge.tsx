'use client';
import { ReactNode } from 'react';

type BadgeColor = 'sky' | 'violet' | 'emerald' | 'orange' | 'rose' | 'gray' | 'amber';

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

const colorMap: Record<BadgeColor, string> = {
  sky: 'bg-sky-50 text-sky-700 border-sky-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function Badge({ color = 'gray', children, icon, size = 'md' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeClass} ${colorMap[color]}`}>
      {icon}
      {children}
    </span>
  );
}
