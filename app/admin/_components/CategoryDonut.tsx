'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';

interface CategoryDatum {
  category: string;
  count: number;
}

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  beach: { label: 'Biển', color: '#0ea5e9', emoji: '🏖️' },
  mountain: { label: 'Núi', color: '#10b981', emoji: '⛰️' },
  city: { label: 'Thành phố', color: '#6366f1', emoji: '🏙️' },
  countryside: { label: 'Đồng quê', color: '#84cc16', emoji: '🌾' },
  historical: { label: 'Lịch sử', color: '#f59e0b', emoji: '🏛️' },
  hotel: { label: 'Khách sạn', color: '#ec4899', emoji: '🏨' },
  restaurant: { label: 'Nhà hàng', color: '#ef4444', emoji: '🍽️' },
  cafe: { label: 'Quán cà phê', color: '#a855f7', emoji: '☕' },
  temple: { label: 'Đền chùa', color: '#f97316', emoji: '🛕' },
  attraction: { label: 'Điểm tham quan', color: '#14b8a6', emoji: '🎡' },
  amusement: { label: 'Giải trí', color: '#eab308', emoji: '🎢' },
  culture: { label: 'Văn hóa', color: '#8b5cf6', emoji: '🎭' },
  landmark: { label: 'Địa danh', color: '#06b6d4', emoji: '📍' },
  other: { label: 'Khác', color: '#94a3b8', emoji: '📦' },
};

const FALLBACK_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#14b8a6', '#ef4444'];

const meta = (cat: string, i: number) =>
  CATEGORY_META[cat] ?? { label: cat, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length], emoji: '📦' };

export default function CategoryDonut({ data }: { data: CategoryDatum[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const slices = data
    .filter((d) => d.count > 0)
    .map((d, i) => ({ ...d, ...meta(d.category, i) }))
    .sort((a, b) => b.count - a.count);

  if (total === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">Chưa có điểm đến nào.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((s) => (
                <Cell key={s.category} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip unit=" điểm đến" />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-gray-800 leading-none">{total}</span>
          <span className="text-[11px] uppercase tracking-wide text-gray-400 mt-1">Điểm đến</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
        {slices.map((s) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <div key={s.category} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-gray-600 truncate flex-1">
                {s.emoji} {s.label}
              </span>
              <span className="text-xs font-semibold text-gray-800 tabular-nums shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
