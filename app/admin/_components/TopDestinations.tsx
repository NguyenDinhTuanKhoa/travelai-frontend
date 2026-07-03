'use client';
import Link from 'next/link';

interface Destination {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location?: { city?: string };
  images?: string[];
}

const RANK_STYLES = [
  'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-500/30',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30',
  'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-orange-500/30',
];

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-amber-400 text-xs tracking-tight" aria-label={`${rating} sao`}>
      {'★'.repeat(full)}
      <span className="text-gray-200">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

export default function TopDestinations({ data }: { data: Destination[] }) {
  const items = (data ?? []).filter(Boolean).slice(0, 5);

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">Chưa có điểm đến nào.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((d, i) => {
        const rankStyle = RANK_STYLES[i] ?? 'bg-gray-100 text-gray-500';
        const img = d.images?.[0];
        const pct = Math.max(8, Math.min(100, (d.rating / 5) * 100));
        return (
          <li key={d._id}>
            <Link
              href={`/admin/destinations?search=${encodeURIComponent(d.name)}`}
              className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-gray-50"
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm ${rankStyle}`}
              >
                {i + 1}
              </span>

              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-sky-100 to-violet-100 flex items-center justify-center">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-base">🏝️</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-violet-600 transition-colors">
                  {d.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars rating={d.rating} />
                  <span className="text-[11px] text-gray-400 truncate">
                    {d.location?.city || 'Chưa rõ'} · {d.reviewCount} đánh giá
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end shrink-0 w-16">
                <span className="text-sm font-bold text-gray-800 tabular-nums">{d.rating.toFixed(1)}</span>
                <span className="mt-1 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
