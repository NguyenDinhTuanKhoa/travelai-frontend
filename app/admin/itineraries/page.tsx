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

interface Itinerary {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'ongoing' | 'completed';
  isPublic?: boolean;
  user: { _id: string; name: string; email: string };
  destinations: { destination?: { _id: string; name: string; images?: string[]; location?: { city?: string } }; order: number; notes?: string; activities?: string[] }[];
  budget?: { estimated?: number; actual?: number };
  createdAt: string;
}

const statusMeta: Record<string, { color: 'sky' | 'amber' | 'emerald'; label: string }> = {
  planning: { color: 'sky', label: '📋 Đang lập' },
  ongoing: { color: 'amber', label: '🚗 Đang đi' },
  completed: { color: 'emerald', label: '✅ Hoàn thành' },
};

export default function AdminItineraries() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [status, setStatus] = useState('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Itinerary | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [detail, setDetail] = useState<Itinerary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminApi.getItineraries({ page, search, status });
    if (error) toast.error(error);
    if (data) {
      const r = data as { itineraries: Itinerary[]; totalPages: number };
      setItems(r.itineraries);
      setTotalPages(r.totalPages);
    }
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleViewDetail = async (it: Itinerary) => {
    setDetailLoading(true);
    setDetail(it); // show modal immediately with summary
    const { data, error } = await adminApi.getItinerary(it._id);
    if (error) toast.error(error);
    else if (data) setDetail(data as Itinerary);
    setDetailLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    const { error } = await adminApi.deleteItinerary(confirmDelete._id);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success('Đã xóa lịch trình');
      setConfirmDelete(null);
      load();
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    const { data, error } = await adminApi.bulkDeleteItineraries(selectedIds);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      const count = (data as { deletedCount: number })?.deletedCount || 0;
      toast.success(`Đã xóa ${count} lịch trình`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      load();
    }
  };

  const columns: Column<Itinerary>[] = [
    {
      key: 'title',
      header: 'Lịch trình',
      render: (it) => (
        <div>
          <p className="font-semibold text-gray-900 truncate">{it.title}</p>
          <p className="text-xs text-gray-500 truncate max-w-[300px]">
            {it.description || <span className="italic">(không mô tả)</span>}
          </p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Người tạo',
      render: (it) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {it.user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm text-gray-700 truncate">{it.user?.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Thời gian',
      render: (it) => (
        <div className="text-xs text-gray-600">
          <p>{new Date(it.startDate).toLocaleDateString('vi-VN')}</p>
          <p className="text-gray-400">→ {new Date(it.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (it) => {
        const meta = statusMeta[it.status] || { color: 'sky' as const, label: it.status };
        return <Badge color={meta.color}>{meta.label}</Badge>;
      },
    },
    {
      key: 'destinations',
      header: 'Điểm',
      render: (it) => <span className="text-sm font-semibold text-gray-700">{it.destinations?.length || 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (it) => (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(it); }}
          className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >🗑 Xóa</button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Lịch trình</h2>
        <p className="text-sm text-gray-500 mt-1">Xem và moderation các lịch trình user tạo</p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Tìm theo tiêu đề..."
        filters={[
          {
            key: 'status',
            label: 'Trạng thái',
            type: 'select',
            value: status,
            onChange: (v) => { setStatus(v); setPage(1); },
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'planning', label: '📋 Đang lập' },
              { value: 'ongoing', label: '🚗 Đang đi' },
              { value: 'completed', label: '✅ Hoàn thành' },
            ],
          },
        ]}
        onReset={() => { setSearch(''); setStatus('all'); setPage(1); }}
      />

      <DataTable<Itinerary>
        columns={columns}
        rows={items}
        getRowId={(it) => it._id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
        onRowClick={handleViewDetail}
        emptyState={<EmptyState icon="🗺️" title="Chưa có lịch trình" />}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-sm font-semibold transition-all"
          >🗑 Xóa tất cả</button>
        }
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Xóa lịch trình"
        message={<>Xóa <strong>{confirmDelete?.title}</strong>? Không thể hoàn tác.</>}
        confirmLabel="Xóa"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa nhiều lịch trình"
        message={<>Sẽ xóa <strong>{selectedIds.length}</strong> lịch trình. Không thể hoàn tác.</>}
        confirmLabel={`Xóa ${selectedIds.length}`}
        danger
        loading={actionLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl border-l border-gray-200 animate-[slideInRight_0.2s_ease]">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-900 truncate">{detail.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">bởi {detail.user?.name || '—'}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge color={statusMeta[detail.status]?.color || 'sky'}>{statusMeta[detail.status]?.label || detail.status}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(detail.startDate).toLocaleDateString('vi-VN')} → {new Date(detail.endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg shrink-0"
              >✕</button>
            </div>

            <div className="p-6 space-y-5">
              {detail.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Mô tả</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Điểm đến ({detail.destinations?.length || 0})
                </p>
                {detailLoading ? (
                  <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
                ) : detail.destinations?.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">(không có)</p>
                ) : (
                  <div className="space-y-2">
                    {detail.destinations?.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {d.order || idx + 1}
                        </div>
                        {d.destination?.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.destination.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {d.destination?.name || <span className="italic text-gray-400">(đã xóa)</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{d.destination?.location?.city || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(detail.budget?.estimated || detail.budget?.actual) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Ngân sách</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <p className="text-xs text-sky-600">Dự kiến</p>
                      <p className="font-bold text-sky-700">{detail.budget?.estimated?.toLocaleString('vi-VN') || 0} đ</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <p className="text-xs text-emerald-600">Thực tế</p>
                      <p className="font-bold text-emerald-700">{detail.budget?.actual?.toLocaleString('vi-VN') || 0} đ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
