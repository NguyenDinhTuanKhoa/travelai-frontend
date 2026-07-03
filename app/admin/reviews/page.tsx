'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '../../lib/adminApi';
import DataTable, { Column } from '../_components/DataTable';
import FilterBar from '../_components/FilterBar';
import Pagination from '../_components/Pagination';
import ConfirmModal from '../_components/ConfirmModal';
import BulkActionBar from '../_components/BulkActionBar';
import Badge from '../_components/Badge';
import EmptyState from '../_components/EmptyState';
import { toast } from '../_components/Toast';

interface Review {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: string };
  destination: { _id: string; name: string };
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
}

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex text-sm">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
    ))}
  </span>
);

export default function AdminReviews() {
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [rating, setRating] = useState('all');
  const [dateFrom, setDateFrom] = useState(searchParams?.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams?.get('dateTo') || '');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminApi.getReviews({
      page,
      rating: rating !== 'all' ? parseInt(rating) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    if (error) toast.error(error);
    if (data) {
      const r = data as { reviews: Review[]; totalPages: number };
      setReviews(r.reviews);
      setTotalPages(r.totalPages);
    }
    setLoading(false);
  }, [page, rating, dateFrom, dateTo]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    const { error } = await adminApi.deleteReview(confirmDelete._id);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success('Đã xóa đánh giá');
      setConfirmDelete(null);
      loadReviews();
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    const { data, error } = await adminApi.bulkDeleteReviews(selectedIds);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      const count = (data as { deletedCount: number })?.deletedCount || 0;
      toast.success(`Đã xóa ${count} đánh giá`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      loadReviews();
    }
  };

  const columns: Column<Review>[] = [
    {
      key: 'user',
      header: 'Người đánh giá',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {r.user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{r.user?.name || '(unknown)'}</p>
            <p className="text-xs text-gray-500 truncate">{r.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Điểm đến',
      render: (r) => <Badge color="sky">{r.destination?.name || '—'}</Badge>,
    },
    {
      key: 'rating',
      header: 'Đánh giá',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Stars rating={r.rating} />
          <span className="text-xs text-gray-500 font-semibold">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Nội dung',
      render: (r) => (
        <div className="max-w-md">
          {r.title && <p className="font-medium text-gray-900 text-sm truncate">{r.title}</p>}
          <p
            className={`text-xs text-gray-600 ${expandedId === r._id ? '' : 'line-clamp-2'} cursor-pointer`}
            onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === r._id ? null : r._id); }}
          >
            {r.content || <span className="italic text-gray-400">(không có nội dung)</span>}
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày',
      render: (r) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}
          className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          🗑 Xóa
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Đánh giá</h2>
        <p className="text-sm text-gray-500 mt-1">Duyệt và moderation đánh giá từ người dùng</p>
      </div>

      <FilterBar
        filters={[
          {
            key: 'rating',
            label: 'Sao',
            type: 'select',
            value: rating,
            onChange: (v) => { setRating(v); setPage(1); },
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: '5', label: '★★★★★ 5' },
              { value: '4', label: '★★★★ 4' },
              { value: '3', label: '★★★ 3' },
              { value: '2', label: '★★ 2' },
              { value: '1', label: '★ 1' },
            ],
          },
          { key: 'from', label: 'Từ', type: 'date', value: dateFrom, onChange: (v) => { setDateFrom(v); setPage(1); } },
          { key: 'to', label: 'Đến', type: 'date', value: dateTo, onChange: (v) => { setDateTo(v); setPage(1); } },
        ]}
        onReset={() => { setRating('all'); setDateFrom(''); setDateTo(''); setPage(1); }}
      />

      <DataTable<Review>
        columns={columns}
        rows={reviews}
        getRowId={(r) => r._id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
        emptyState={<EmptyState icon="⭐" title="Không có đánh giá" description="Thử bỏ bộ lọc hoặc đợi user đánh giá mới." />}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-sm font-semibold transition-all"
          >
            🗑 Xóa tất cả
          </button>
        }
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Xóa đánh giá"
        message="Bạn có chắc muốn xóa đánh giá này? Rating của điểm đến sẽ được tính lại."
        confirmLabel="Xóa"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa nhiều đánh giá"
        message={<>Sẽ xóa <strong>{selectedIds.length}</strong> đánh giá. Rating các điểm đến liên quan sẽ tính lại.</>}
        confirmLabel={`Xóa ${selectedIds.length}`}
        danger
        loading={actionLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  );
}
