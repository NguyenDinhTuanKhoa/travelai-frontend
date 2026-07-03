'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Tính range pages hiển thị (smart: luôn show 1, current ± 2, last)
  const pages: (number | 'dots')[] = [];
  const add = (p: number | 'dots') => pages.push(p);
  const range = (a: number, b: number) => {
    for (let i = a; i <= b; i++) add(i);
  };

  if (totalPages <= 7) {
    range(1, totalPages);
  } else {
    add(1);
    if (page > 4) add('dots');
    const start = Math.max(2, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    range(start, end);
    if (page < totalPages - 3) add('dots');
    add(totalPages);
  }

  const btnBase = 'min-w-[40px] h-10 px-3 rounded-xl text-sm font-semibold transition-all';

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ‹
      </button>
      {pages.map((p, idx) =>
        p === 'dots' ? (
          <span key={`dots-${idx}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === page
                ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-md shadow-violet-500/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btnBase} bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ›
      </button>
    </div>
  );
}
