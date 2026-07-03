'use client';
import { ReactNode } from 'react';

interface AdminCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export default function AdminCard({
  title,
  subtitle,
  headerRight,
  children,
  className = '',
  padding = 'md',
}: AdminCardProps) {
  const padMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {(title || headerRight) && (
        <div className={`flex items-start justify-between gap-4 ${padding === 'none' ? 'p-6' : padMap[padding]} ${children ? 'pb-3 border-b border-gray-50' : ''}`}>
          <div>
            {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className={padding === 'none' ? '' : padMap[padding]}>{children}</div>
    </div>
  );
}
