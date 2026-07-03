'use client';
import { useState } from 'react';
import { useAdminStats } from './_hooks/useAdminStats';
import { DashboardSkeleton } from './_components/AdminSkeleton';
import StatCard from './_components/StatCard';
import AdminCard from './_components/AdminCard';
import EmptyState from './_components/EmptyState';
import DateRangePicker from './_components/DateRangePicker';
import QuickActions from './_components/QuickActions';
import CategoryDonut from './_components/CategoryDonut';
import TopDestinations from './_components/TopDestinations';
import ChartTooltip from './_components/ChartTooltip';
import ChartDrillDownModal, { DrillDownInfo } from './_components/ChartDrillDownModal';
import {
  Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell,
} from 'recharts';

const ratingColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];

const formatDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
};

const rangeLabel = (days: number) => `${days} ngày gần nhất`;

const cardTitle = (t: string) => <span className="text-[11px] uppercase text-gray-500 font-bold tracking-wider">{t}</span>;
const cardSub = (t: string) => <span className="text-xs text-gray-400">{t}</span>;

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [drillDown, setDrillDown] = useState<DrillDownInfo | null>(null);
  const { stats, isLoading, isValidating, error, refresh } = useAdminStats(days);

  if (isLoading && !stats) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <EmptyState
        title="Không tải được dữ liệu"
        description="Kiểm tra kết nối backend hoặc thử lại."
        action={
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Thử lại
          </button>
        }
      />
    );
  }

  const growthData = stats.userGrowth.map((x) => ({ ...x, label: formatDate(x.date) }));
  const reviewData = stats.reviewsOverTime.map((x) => ({ ...x, label: formatDate(x.date) }));

  const totalNewUsers = growthData.reduce((s, x) => s + x.count, 0);
  const totalNewReviews = reviewData.reduce((s, x) => s + x.count, 0);
  const ratingTotal = stats.ratingDistribution.reduce((s, x) => s + x.count, 0);
  const avgRating = ratingTotal
    ? stats.ratingDistribution.reduce((s, x) => s + x.rating * x.count, 0) / ratingTotal
    : 0;

  const onGrowthClick = (payload: { date?: string; count?: number } | undefined) => {
    if (!payload?.date) return;
    setDrillDown({ kind: 'users', date: payload.date, count: payload.count ?? 0 });
  };
  const onReviewClick = (payload: { date?: string; count?: number } | undefined) => {
    if (!payload?.date) return;
    setDrillDown({ kind: 'reviews', date: payload.date, count: payload.count ?? 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Bảng điều khiển</h2>
          <p className="text-sm text-gray-500 mt-2">Chào mừng trở lại — tổng quan hệ thống TravelAI</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker value={days} onChange={setDays} disabled={isValidating} />
          <button
            onClick={() => refresh()}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-violet-300 hover:text-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Làm mới dữ liệu"
          >
            <span className={isValidating ? 'inline-block animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">{isValidating ? 'Đang cập nhật…' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Người dùng" value={stats.counts.users} icon="👥" trend={stats.trends.users} accent="sky" sparkData={growthData.map((x) => x.count)} />
        <StatCard label="Điểm đến" value={stats.counts.destinations} icon="🏝️" hint="Tổng toàn hệ thống" accent="emerald" />
        <StatCard label="Đánh giá" value={stats.counts.reviews} icon="⭐" trend={stats.trends.reviews} accent="orange" sparkData={reviewData.map((x) => x.count)} />
        <StatCard label="Lịch trình" value={stats.counts.itineraries} icon="🗺️" hint="Tổng toàn hệ thống" accent="violet" />
      </div>

      {/* Charts row 1: hero growth + rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AdminCard
          className="lg:col-span-2"
          title={cardTitle('Tăng trưởng người dùng')}
          subtitle={cardSub(rangeLabel(days))}
          headerRight={
            <div className="text-right">
              <p className="text-2xl font-extrabold text-gray-800 leading-none">+{totalNewUsers}</p>
              <p className="text-[11px] text-gray-400 mt-1">user mới</p>
            </div>
          }
        >
          {growthData.length === 0 ? (
            <EmptyState icon="📈" title="Chưa có dữ liệu" description={`Cần ít nhất 1 user đăng ký trong ${days} ngày qua.`} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={growthData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }} onClick={(s) => onGrowthClick(growthData[Number(s.activeIndex)])}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="growthStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} dy={4} />
                <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <Tooltip cursor={{ stroke: '#c7d2fe', strokeWidth: 1.5 }} content={<ChartTooltip nameMap={{ count: 'Người dùng mới' }} />} />
                <Area type="monotone" dataKey="count" stroke="url(#growthStroke)" strokeWidth={3} fill="url(#growthFill)" dot={{ fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2, r: 3 }} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AdminCard>

        <AdminCard
          title={cardTitle('Phân bố đánh giá')}
          subtitle={cardSub(`Tổng ${ratingTotal} đánh giá`)}
          headerRight={
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600">
              <span className="text-lg font-extrabold leading-none">{avgRating.toFixed(1)}</span>
              <span className="text-sm">★</span>
            </div>
          }
        >
          {stats.ratingDistribution.every((x) => x.count === 0) ? (
            <EmptyState icon="⭐" title="Chưa có đánh giá" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.ratingDistribution} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  {ratingColors.map((c, i) => (
                    <linearGradient key={i} id={`rate${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="rating" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}★`} dy={4} />
                <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <Tooltip cursor={{ fill: '#f9fafb' }} content={<ChartTooltip nameMap={{ count: 'Số lượng' }} labelFormatter={(l) => `${l} sao`} />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {stats.ratingDistribution.map((_, i) => <Cell key={i} fill={`url(#rate${i})`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </AdminCard>
      </div>

      {/* Charts row 2: reviews over time + category donut + top destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AdminCard
          title={cardTitle('Đánh giá theo thời gian')}
          subtitle={cardSub(rangeLabel(days))}
          headerRight={
            <div className="text-right">
              <p className="text-2xl font-extrabold text-gray-800 leading-none">+{totalNewReviews}</p>
              <p className="text-[11px] text-gray-400 mt-1">đánh giá mới</p>
            </div>
          }
        >
          {reviewData.length === 0 ? (
            <EmptyState icon="💬" title="Chưa có đánh giá" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={reviewData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }} onClick={(s) => onReviewClick(reviewData[Number(s.activeIndex)])}>
                <defs>
                  <linearGradient id="reviewFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} dy={4} />
                <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <Tooltip cursor={{ stroke: '#a7f3d0', strokeWidth: 1.5 }} content={<ChartTooltip nameMap={{ count: 'Đánh giá' }} />} />
                <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={3} fill="url(#reviewFill)" dot={{ fill: '#fff', stroke: '#059669', strokeWidth: 2, r: 3 }} activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AdminCard>

        <AdminCard
          title={cardTitle('Điểm đến theo danh mục')}
          subtitle={cardSub('Phân bố toàn hệ thống')}
        >
          <CategoryDonut data={stats.destinationsByCategory} />
        </AdminCard>

        <AdminCard
          title={cardTitle('Top điểm đến')}
          subtitle={cardSub('Xếp theo đánh giá')}
        >
          <TopDestinations data={stats.topDestinations} />
        </AdminCard>
      </div>

      {/* Bottom row: Quick actions + Recent activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Hành động nhanh</h3>
          </div>
          <QuickActions />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Hoạt động gần đây</h3>
            <a href="#" className="text-sm font-semibold text-blue-600 hover:underline">Xem tất cả ↗</a>
          </div>
          <AdminCard padding="none">
            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto scrollbar-thin">
              {stats.recentUsers.map((u) => (
                <div key={u._id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Người dùng mới <span className="font-semibold text-gray-900">{u.name}</span> đã đăng ký</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
              {stats.recentReviews.map((r) => (
                <div key={r._id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800"><span className="font-semibold text-gray-900">{r.user?.name}</span> đã đánh giá {r.rating}★ cho <span className="font-semibold text-gray-900">{r.destination?.name}</span></p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
              {stats.recentUsers.length === 0 && stats.recentReviews.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">Chưa có hoạt động nào</div>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      <ChartDrillDownModal info={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
}
