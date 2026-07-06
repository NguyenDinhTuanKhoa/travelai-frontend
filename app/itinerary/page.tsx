'use client';
/* eslint-disable react/no-unknown-property */
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import ShareItineraryModal from '../components/chat/ShareItineraryModal';

interface Destination {
  _id: string;
  name: string;
  images: string[];
  location: { city: string; country: string };
  category: string;
  rating: number;
}

interface ItineraryDestination {
  destination: Destination;
  order: number;
  notes: string;
  activities: string[];
}

interface Itinerary {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  destinations: ItineraryDestination[];
}

type SortKey = 'newest' | 'upcoming' | 'longest' | 'shortest';

const statusConfig: Record<string, { label: string; color: string; icon: string; bg: string; next?: string }> = {
  planning: { label: 'Đang lên kế hoạch', color: 'text-amber-700', icon: '📝', bg: 'bg-amber-50 border-amber-200', next: 'ongoing' },
  ongoing:  { label: 'Đang diễn ra',      color: 'text-emerald-700', icon: '🚀', bg: 'bg-emerald-50 border-emerald-200', next: 'completed' },
  completed:{ label: 'Đã hoàn thành',     color: 'text-gray-600',    icon: '✅', bg: 'bg-gray-50 border-gray-200' },
};

const nextStatusLabel: Record<string, string> = {
  planning: '→ Bắt đầu chuyến đi',
  ongoing: '→ Đánh dấu hoàn thành',
};

// ── Nhắc nhở lịch trình sắp khởi hành ─────────────────────────────────────────
const REMINDER_WINDOW_DAYS = 7;

// Số ngày còn lại tới ngày khởi hành (0 = hôm nay, 1 = ngày mai, âm nếu đã qua).
function getDaysUntilDeparture(startDate: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const s = new Date(startDate);
  const start = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  return Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Trip 'planning' khởi hành trong vòng REMINDER_WINDOW_DAYS ngày (tính cả hôm nay).
function isUpcomingDeparture(itin: Itinerary): boolean {
  if (itin.status !== 'planning') return false;
  const d = getDaysUntilDeparture(itin.startDate);
  return d >= 0 && d <= REMINDER_WINDOW_DAYS;
}

// Nhãn + màu badge đếm ngược theo mức độ khẩn.
function getCountdownInfo(days: number): { label: string; badge: string; dot: string } {
  if (days <= 0) return { label: 'Khởi hành hôm nay!', badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
  if (days === 1) return { label: 'Ngày mai khởi hành', badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
  if (days <= 3) return { label: `Còn ${days} ngày`, badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
  return { label: `Còn ${days} ngày`, badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
}

// ── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-1.5 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded-xl w-3/4" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
            <div className="flex gap-4">
              <div className="h-4 bg-gray-100 rounded-lg w-32" />
              <div className="h-4 bg-gray-100 rounded-lg w-20" />
              <div className="h-4 bg-gray-100 rounded-lg w-24" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="w-16 h-9 bg-gray-100 rounded-xl" />
            <div className="w-16 h-9 bg-gray-100 rounded-xl" />
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-100 rounded-lg w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Share Toast ──────────────────────────────────────────────────────────────
const toastStyle: React.CSSProperties = {
  animation: 'fadeInUp 0.3s ease-out both',
};

function ShareToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={toastStyle}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl"
    >
      <span className="text-lg">✅</span>
      <span className="font-medium text-sm">Đã sao chép liên kết lịch trình!</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ItineraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItineraryId, setShareItineraryId] = useState<string | undefined>(undefined);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadItineraries();
  }, [user, authLoading]);

  // Banner nhắc nhở đã tắt trong hôm nay chưa (tự hiện lại vào ngày mới).
  useEffect(() => {
    const dismissedOn = localStorage.getItem('itineraryReminderDismissed');
    setReminderDismissed(dismissedOn === new Date().toDateString());
  }, []);

  const dismissReminder = () => {
    localStorage.setItem('itineraryReminderDismissed', new Date().toDateString());
    setReminderDismissed(true);
  };

  const loadItineraries = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setItineraries(data.data);
    } catch (error) {
      console.error('Error loading itineraries:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa lịch trình này?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setItineraries((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
    setDeletingId(null);
  };

  // ── Quick status update ──────────────────────────────────────────────────
  const handleStatusUpdate = async (itin: Itinerary) => {
    const nextStatus = statusConfig[itin.status]?.next;
    if (!nextStatus) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setUpdatingId(itin._id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries/${itin._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setItineraries((prev) =>
          prev.map((i) => (i._id === itin._id ? { ...i, status: nextStatus } : i))
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setUpdatingId(null);
  };

  // ── Share handler ────────────────────────────────────────────────────────
  const handleShare = (id: string) => {
    const link = `${window.location.origin}/itinerary/${id}`;
    navigator.clipboard.writeText(link).then(() => setShowShareToast(true));
  };

  const handleShareToFriends = (id: string) => {
    setShareItineraryId(id);
    setShareModalOpen(true);
  };

  const getDayCount = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // ── Filter → Search → Sort ───────────────────────────────────────────────
  const processedItineraries = useMemo(() => {
    let list = [...itineraries];

    // 1. Filter by status
    if (filter !== 'all') list = list.filter((i) => i.status === filter);

    // 2. Search by title or destination name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.destinations.some((d) => d.destination?.name?.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    list.sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      if (sortBy === 'upcoming') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (sortBy === 'longest')  return getDayCount(b.startDate, b.endDate) - getDayCount(a.startDate, a.endDate);
      if (sortBy === 'shortest') return getDayCount(a.startDate, a.endDate) - getDayCount(b.startDate, b.endDate);
      return 0;
    });

    return list;
  }, [itineraries, filter, searchQuery, sortBy]);

  // ── Trip sắp khởi hành (dùng cho banner nhắc nhở) ─────────────────────────
  const upcomingTrips = useMemo(
    () =>
      itineraries
        .filter(isUpcomingDeparture)
        .sort((a, b) => getDaysUntilDeparture(a.startDate) - getDaysUntilDeparture(b.startDate)),
    [itineraries]
  );

  // ── Auth loading screen ──────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-violet-50/20">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Đang xác thực...</p>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-violet-50/20">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">

          {/* ── Hero Header ── */}
          <div className="relative mb-6 bg-transparent border-2 border-sky-500 rounded-3xl p-6 md:p-8 overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🗺️</span>
                  <h1 className="text-2xl md:text-3xl font-bold text-sky-600">Lịch Trình Của Tôi</h1>
                </div>
                <p className="text-gray-600 text-base max-w-xl">
                  Quản lý và theo dõi chuyến hành trình du lịch của bạn.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {[
                  { label: 'Tổng', value: itineraries.length, color: 'text-sky-600' },
                  { label: 'Đang đi', value: itineraries.filter((i) => i.status === 'ongoing').length, color: 'text-emerald-500' },
                  { label: 'Hoàn thành', value: itineraries.filter((i) => i.status === 'completed').length, color: 'text-amber-500' },
                  { label: 'Kế hoạch', value: itineraries.filter((i) => i.status === 'planning').length, color: 'text-sky-500' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-sky-200 text-center shrink-0 min-w-[80px]">
                    <p className={`text-xl font-bold leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Reminder Banner (chuyến sắp khởi hành) ── */}
          {!loading && !reminderDismissed && upcomingTrips.length > 0 && (
            <div className="relative mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 md:p-5 shadow-sm overflow-hidden">
              <button
                onClick={dismissReminder}
                title="Ẩn nhắc nhở hôm nay"
                className="absolute top-3 right-3 w-7 h-7 rounded-full text-amber-500 hover:bg-amber-100 hover:text-amber-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-2xl animate-pulse">🔔</div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-bold text-amber-800 text-base md:text-lg">
                    Bạn có {upcomingTrips.length} chuyến sắp khởi hành!
                  </h3>
                  <p className="text-amber-700/80 text-sm mb-3">
                    Đừng quên chuẩn bị cho các chuyến đi trong {REMINDER_WINDOW_DAYS} ngày tới nhé.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {upcomingTrips.map((t) => {
                      const info = getCountdownInfo(getDaysUntilDeparture(t.startDate));
                      return (
                        <Link
                          key={t._id}
                          href={`/itinerary/${t._id}`}
                          className="group inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-amber-200 rounded-xl pl-2.5 pr-3 py-1.5 transition-all hover:shadow-sm"
                        >
                          <span className={`w-2 h-2 rounded-full ${info.dot} animate-pulse`} />
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 truncate max-w-[180px]">
                            {t.title}
                          </span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${info.badge}`}>
                            {info.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Toolbar (Search, Filter, Sort) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-8 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {[
                { id: 'all',       label: 'Tất cả',              icon: '📋' },
                { id: 'planning',  label: 'Lên kế hoạch',        icon: '📝' },
                { id: 'ongoing',   label: 'Đang diễn ra',        icon: '🚀' },
                { id: 'completed', label: 'Hoàn thành',          icon: '✅' },
              ].map((tab) => {
                const count = tab.id === 'all' ? itineraries.length : itineraries.filter((i) => i.status === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3 py-2 rounded-xl font-medium transition-all text-sm flex items-center gap-1.5 whitespace-nowrap ${
                      filter === tab.id
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      filter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative min-w-[200px] lg:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                <input
                  id="itinerary-search"
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <select
                  id="itinerary-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="text-sm font-semibold text-gray-700 bg-transparent rounded-xl pl-3 pr-8 py-2 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="newest">📅 Mới nhất</option>
                  <option value="upcoming">⏳ Sắp diễn ra</option>
                  <option value="longest">📆 Dài ngày nhất</option>
                  <option value="shortest">⚡ Ngắn ngày nhất</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">▼</span>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : processedItineraries.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-28 h-28 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-sky-200">
                <span className="text-6xl">{searchQuery ? '🔍' : '✈️'}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchQuery
                  ? `Không tìm thấy kết quả cho "${searchQuery}"`
                  : filter === 'all'
                  ? 'Chưa có lịch trình nào'
                  : 'Không có lịch trình nào'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
                  : filter === 'all'
                  ? 'Hãy nhờ AI tạo lịch trình du lịch đầu tiên cho bạn nhé!'
                  : 'Không tìm thấy lịch trình nào với bộ lọc hiện tại.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  ✕ Xóa tìm kiếm
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/ai-chat"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all hover:scale-105"
                  >
                    🤖 Chat với AI để tạo lịch trình
                  </Link>
                  <Link
                    href="/itinerary/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 font-semibold rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all hover:scale-105"
                  >
                    ✍️ Tạo thủ công
                  </Link>
                </div>
              )}
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedItineraries.map((itin) => {
                const status = statusConfig[itin.status] || statusConfig.planning;
                const days = getDayCount(itin.startDate, itin.endDate);
                const isDeleting = deletingId === itin._id;
                const isUpdating = updatingId === itin._id;

                // Đếm ngược ngày khởi hành cho trip 'planning' sắp tới
                const daysUntil = itin.status === 'planning' ? getDaysUntilDeparture(itin.startDate) : -1;
                const isUpcoming = daysUntil >= 0 && daysUntil <= REMINDER_WINDOW_DAYS;
                const countdown = isUpcoming ? getCountdownInfo(daysUntil) : null;

                // Chuẩn bị danh sách ảnh điểm đến cho Overlapping Avatars
                const displayDests = itin.destinations.slice(0, 4);
                const extraCount = itin.destinations.length - 4;

                return (
                  <div
                    key={itin._id}
                    className={`relative group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-sky-300 transition-all duration-300 flex flex-col overflow-hidden ${
                      isDeleting ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    {/* Status Top Bar */}
                    <div className={`h-1.5 shrink-0 ${
                      itin.status === 'ongoing' ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : itin.status === 'completed' ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                      : 'bg-gradient-to-r from-sky-400 to-violet-500'
                    }`} />

                    {/* Small Utility Actions (Share & Delete) */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareToFriends(itin._id); }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                        title="Chia sẻ với bạn bè"
                      >
                        💬
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(itin._id); }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
                        title="Sao chép link"
                      >
                        🔗
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(itin._id); }}
                        disabled={isDeleting}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                        title="Xóa"
                      >
                        {isDeleting ? '⏳' : '🗑️'}
                      </button>
                    </div>

                    {/* Main Clickable Area */}
                    <Link href={`/itinerary/${itin._id}`} className="flex-1 p-5 md:p-6 flex flex-col relative z-10">
                      
                      {/* Meta & Title */}
                      <div className="mb-4">
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${status.bg} ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          {countdown && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${countdown.badge}`}>
                              ⏰ {countdown.label}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-sky-600 transition-colors line-clamp-2 pr-16 leading-tight">
                          {itin.title}
                        </h3>
                      </div>

                      {/* Overlapping Avatars (Destinations) */}
                      {itin.destinations.length > 0 && (
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex -space-x-3">
                            {displayDests.map((d, idx) => (
                              <div key={idx} className="relative w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0">
                                <Image
                                  src={d.destination?.images?.[0] || 'https://via.placeholder.com/100'}
                                  alt={d.destination?.name || 'Destination'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {extraCount > 0 && (
                              <div className="relative w-9 h-9 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 z-10">
                                +{extraCount}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium truncate">
                            {itin.destinations.length} điểm dừng
                          </p>
                        </div>
                      )}

                      <div className="flex-1" /> {/* Spacer */}

                      {/* Footer Info (Dates) */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-500 text-lg">📅</span>
                          {new Date(itin.startDate).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })}
                          &nbsp;-&nbsp;
                          {new Date(itin.endDate).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })}
                        </div>
                        <div className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                          {days} ngày
                        </div>
                      </div>
                    </Link>

                    {/* Quick Action Bottom Bar */}
                    {statusConfig[itin.status]?.next && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusUpdate(itin); }}
                        disabled={isUpdating}
                        className={`w-full py-3 text-sm font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${
                          itin.status === 'planning' 
                            ? 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {isUpdating ? '⏳ Đang cập nhật...' : nextStatusLabel[itin.status]}
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
          )}

          {/* ── Floating CTA ── */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/ai-chat"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all hover:scale-105 text-lg"
            >
              🤖 Tạo lịch trình mới với AI
            </Link>
            <Link
              href="/itinerary/create"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-800 font-bold rounded-2xl shadow-lg border border-gray-200 hover:border-sky-300 hover:shadow-xl transition-all hover:scale-105 text-lg"
            >
              ✍️ Tạo thủ công
            </Link>
          </div>
        </div>
      </div>

      <Footer />

      {/* ── Share Toast Notification ── */}
      {showShareToast && <ShareToast onClose={() => setShowShareToast(false)} />}

      {/* ── Share to friends modal ── */}
      <ShareItineraryModal
        open={shareModalOpen}
        onClose={() => { setShareModalOpen(false); setShareItineraryId(undefined); }}
        preselectedItineraryId={shareItineraryId}
      />

      {/* ── Global Animation Keyframes ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
