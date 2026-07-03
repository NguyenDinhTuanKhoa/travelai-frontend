'use client';
import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  /** Base color (hex). A vertical gradient fades it to transparent. */
  color?: string;
  height?: number;
}

export default function Sparkline({ data, color = '#3b82f6', height = 40 }: SparklineProps) {
  const id = useId().replace(/:/g, '');
  if (!data || data.length === 0) return null;

  // Recharts needs at least 2 points to draw a line; pad a flat one.
  const points = (data.length === 1 ? [data[0], data[0]] : data).map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
