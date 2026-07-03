'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../lib/adminApi';

interface UserHit { _id: string; name: string; email: string; avatar?: string; role: string }
interface DestHit { _id: string; name: string; location?: { city?: string }; category?: string }
interface ItinHit { _id: string; title: string; startDate?: string; endDate?: string }

interface SearchResults {
  users: UserHit[];
  destinations: DestHit[];
  itineraries: ItinHit[];
}

type FlatHit =
  | { kind: 'user'; href: string; title: string; subtitle: string; icon: string }
  | { kind: 'destination'; href: string; title: string; subtitle: string; icon: string }
  | { kind: 'itinerary'; href: string; title: string; subtitle: string; icon: string };

function flatten(r: SearchResults): FlatHit[] {
  return [
    ...r.users.map((u): FlatHit => ({
      kind: 'user',
      href: `/admin/users?search=${encodeURIComponent(u.email)}`,
      title: u.name,
      subtitle: `${u.email} · ${u.role}`,
      icon: '👤',
    })),
    ...r.destinations.map((d): FlatHit => ({
      kind: 'destination',
      href: `/admin/destinations?search=${encodeURIComponent(d.name)}`,
      title: d.name,
      subtitle: `${d.location?.city || ''}${d.category ? ' · ' + d.category : ''}`.trim() || 'Điểm đến',
      icon: '🏝️',
    })),
    ...r.itineraries.map((i): FlatHit => ({
      kind: 'itinerary',
      href: `/admin/itineraries?search=${encodeURIComponent(i.title)}`,
      title: i.title,
      subtitle: 'Lịch trình',
      icon: '🗺️',
    })),
  ];
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cmd/Ctrl+K to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await adminApi.globalSearch(q);
      if (data) {
        setResults(data as SearchResults);
        setActiveIdx(0);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const hits = results ? flatten(results) : [];

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && hits[activeIdx]) {
        e.preventDefault();
        router.push(hits[activeIdx].href);
        setOpen(false);
        setQuery('');
      }
    },
    [open, hits, activeIdx, router],
  );

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-16 py-2 bg-gray-100 border-transparent rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded">
          ⌘K
        </kbd>
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-[420px] overflow-y-auto animate-[fadeInScale_0.15s_ease]">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              <span className="inline-block animate-spin mr-2">⏳</span> Đang tìm…
            </div>
          )}
          {!loading && hits.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Không có kết quả cho <span className="font-semibold text-gray-600">&quot;{query}&quot;</span>
            </div>
          )}
          {!loading && hits.length > 0 && (
            <ul className="py-1">
              {hits.map((hit, i) => (
                <li key={`${hit.kind}-${i}`}>
                  <Link
                    href={hit.href}
                    onClick={() => { setOpen(false); setQuery(''); }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      i === activeIdx ? 'bg-violet-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{hit.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{hit.title}</p>
                      <p className="text-xs text-gray-500 truncate">{hit.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider shrink-0 font-semibold">
                      {hit.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
