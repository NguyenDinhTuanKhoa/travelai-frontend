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

interface SpecialtyItem {
  name: string;
  description?: string;
  imageUrl?: string;
  estimatedPrice?: string;
}

interface Specialty {
  _id: string;
  stt: number;
  province: string;
  region: string;
  localDishes: SpecialtyItem[];
  souvenirs: SpecialtyItem[];
  localDishesText?: string;
  souvenirsText?: string;
}

type BadgeColor = 'sky' | 'amber' | 'emerald' | 'orange';

const regions: { id: string; label: string; color: BadgeColor }[] = [
  { id: 'Miền Bắc', label: '🌲 Miền Bắc', color: 'sky' },
  { id: 'Miền Trung', label: '🌊 Miền Trung', color: 'amber' },
  { id: 'Miền Nam', label: '🌴 Miền Nam', color: 'emerald' },
  { id: 'Tây Nguyên', label: '⛰️ Tây Nguyên', color: 'orange' },
];

const getRegionMeta = (id: string) =>
  regions.find((r) => r.id === id) || { id, label: id, color: 'gray' as const };

const emptyItem = (): SpecialtyItem => ({ name: '', description: '', imageUrl: '', estimatedPrice: '' });

// ── Khối chỉnh sửa 1 danh sách item (món ăn / đặc sản) ──────────
// Tách ra ngoài component cha để tránh remount → mất focus khi gõ.
function ItemListEditor({
  title,
  icon,
  namePlaceholder,
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  title: string;
  icon: string;
  namePlaceholder: string;
  items: SpecialtyItem[];
  onUpdate: (index: number, key: keyof SpecialtyItem, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">{icon} {title}</h4>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        >+ Thêm dòng</button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-gray-50 border border-gray-100 rounded-xl p-3">
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate(idx, 'name', e.target.value)}
              className="md:col-span-3 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              placeholder={namePlaceholder}
            />
            <input
              type="text"
              value={item.description || ''}
              onChange={(e) => onUpdate(idx, 'description', e.target.value)}
              className="md:col-span-4 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              placeholder="Mô tả ngắn"
            />
            <input
              type="text"
              value={item.imageUrl || ''}
              onChange={(e) => onUpdate(idx, 'imageUrl', e.target.value)}
              className="md:col-span-3 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs font-mono"
              placeholder="URL ảnh"
            />
            <input
              type="text"
              value={item.estimatedPrice || ''}
              onChange={(e) => onUpdate(idx, 'estimatedPrice', e.target.value)}
              className="md:col-span-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              placeholder="Giá"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="md:col-span-1 h-[38px] flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa dòng"
            >✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminSpecialties() {
  const searchParams = useSearchParams();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [regionFilter, setRegionFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Specialty | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    stt: '' as string | number,
    province: '',
    region: 'Miền Bắc',
    localDishes: [emptyItem()] as SpecialtyItem[],
    souvenirs: [emptyItem()] as SpecialtyItem[],
  });

  const loadSpecialties = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminApi.getSpecialties({
      page,
      search,
      region: regionFilter !== 'all' ? regionFilter : undefined,
    });
    if (error) toast.error(error);
    if (data) {
      const r = data as { specialties: Specialty[]; totalPages: number; total: number };
      setSpecialties(r.specialties);
      setTotalPages(r.totalPages);
      setTotal(r.total);
    }
    setLoading(false);
  }, [page, search, regionFilter]);

  useEffect(() => { loadSpecialties(); }, [loadSpecialties]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      stt: '',
      province: '',
      region: 'Miền Bắc',
      localDishes: [emptyItem()],
      souvenirs: [emptyItem()],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Bỏ các item rỗng (không có tên)
    const localDishes = formData.localDishes.filter((i) => i.name.trim());
    const souvenirs = formData.souvenirs.filter((i) => i.name.trim());

    const payload = {
      stt: formData.stt === '' ? undefined : Number(formData.stt),
      province: formData.province.trim(),
      region: formData.region,
      localDishes,
      souvenirs,
    };

    const { error } = editingId
      ? await adminApi.updateSpecialty(editingId, payload)
      : await adminApi.createSpecialty(payload);

    setSaving(false);
    if (error) toast.error(error);
    else {
      toast.success(editingId ? 'Đã cập nhật đặc sản' : 'Đã thêm đặc sản mới');
      setShowModal(false);
      resetForm();
      loadSpecialties();
    }
  };

  const handleEdit = (s: Specialty) => {
    setEditingId(s._id);
    setFormData({
      stt: s.stt ?? '',
      province: s.province,
      region: s.region,
      localDishes: s.localDishes?.length ? s.localDishes.map((i) => ({ ...i })) : [emptyItem()],
      souvenirs: s.souvenirs?.length ? s.souvenirs.map((i) => ({ ...i })) : [emptyItem()],
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    const { error } = await adminApi.deleteSpecialty(confirmDelete._id);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success(`Đã xóa đặc sản ${confirmDelete.province}`);
      setConfirmDelete(null);
      loadSpecialties();
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    const { data, error } = await adminApi.bulkDeleteSpecialties(selectedIds);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      const count = (data as { deletedCount: number })?.deletedCount || 0;
      toast.success(`Đã xóa ${count} đặc sản`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      loadSpecialties();
    }
  };

  // ── Helpers chỉnh sửa danh sách item ─────────────────────────
  const updateItem = (
    field: 'localDishes' | 'souvenirs',
    index: number,
    key: keyof SpecialtyItem,
    value: string
  ) => {
    setFormData((prev) => {
      const list = prev[field].map((it, i) => (i === index ? { ...it, [key]: value } : it));
      return { ...prev, [field]: list };
    });
  };

  const addItem = (field: 'localDishes' | 'souvenirs') => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], emptyItem()] }));
  };

  const removeItem = (field: 'localDishes' | 'souvenirs', index: number) => {
    setFormData((prev) => {
      const list = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: list.length ? list : [emptyItem()] };
    });
  };

  const columns: Column<Specialty>[] = [
    {
      key: 'province',
      header: 'Tỉnh / Thành phố',
      render: (s) => {
        const meta = getRegionMeta(s.region);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg shrink-0">
              🍜
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {s.stt ? `${s.stt}. ` : ''}{s.province}
              </p>
              <Badge color={meta.color} size="sm">{meta.label}</Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: 'localDishes',
      header: 'Món ăn thưởng thức tại địa phương',
      render: (s) => {
        const names = (s.localDishes || []).map((d) => d.name).filter(Boolean);
        if (!names.length) return <span className="text-xs text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[320px]">
            {names.map((n, i) => (
              <span key={i} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-md">
                {n}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'souvenirs',
      header: 'Đặc sản mua làm quà',
      render: (s) => {
        const names = (s.souvenirs || []).map((d) => d.name).filter(Boolean);
        if (!names.length) return <span className="text-xs text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[320px]">
            {names.map((n, i) => (
              <span key={i} className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                {n}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
            className="px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
          >✏️ Sửa</button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(s); }}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >🗑 Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Đặc sản & Món ăn</h2>
          <p className="text-sm text-gray-500 mt-1">
            Món ăn địa phương và đặc sản mua làm quà theo từng tỉnh/thành ({total} tỉnh)
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 text-sm font-semibold"
        >
          ✨ Thêm đặc sản
        </button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Tìm theo tỉnh, món ăn hoặc đặc sản..."
        filters={[
          {
            key: 'region',
            label: 'Vùng miền',
            type: 'select',
            value: regionFilter,
            onChange: (v) => { setRegionFilter(v); setPage(1); },
            options: [
              { value: 'all', label: 'Tất cả' },
              ...regions.map((r) => ({ value: r.id, label: r.label })),
            ],
          },
        ]}
        onReset={() => { setSearch(''); setRegionFilter('all'); setPage(1); }}
      />

      <DataTable<Specialty>
        columns={columns}
        rows={specialties}
        getRowId={(s) => s._id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
        emptyState={<EmptyState icon="🍜" title="Chưa có đặc sản" description="Nhấn ✨ Thêm đặc sản để bắt đầu." />}
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
        title="Xóa đặc sản"
        message={<>Xóa đặc sản của <strong>{confirmDelete?.province}</strong>? Không thể hoàn tác.</>}
        confirmLabel="Xóa"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa nhiều đặc sản"
        message={<>Sẽ xóa <strong>{selectedIds.length}</strong> tỉnh/thành. Không thể hoàn tác.</>}
        confirmLabel={`Xóa ${selectedIds.length}`}
        danger
        loading={actionLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* ── EDIT/CREATE MODAL ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? '✏️ Sửa đặc sản' : '✨ Thêm đặc sản mới'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Món ăn địa phương & đặc sản mua làm quà</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <section className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">📝 Thông tin cơ bản</h4>
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">STT</label>
                    <input
                      type="number"
                      value={formData.stt}
                      onChange={(e) => setFormData({ ...formData, stt: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="1"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tỉnh/Thành phố *</label>
                    <input
                      type="text" required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="VD: Hà Nội"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vùng miền *</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <ItemListEditor
                title="Món ăn thưởng thức tại địa phương"
                icon="🍲"
                namePlaceholder="VD: Phở bò"
                items={formData.localDishes}
                onUpdate={(idx, key, value) => updateItem('localDishes', idx, key, value)}
                onAdd={() => addItem('localDishes')}
                onRemove={(idx) => removeItem('localDishes', idx)}
              />

              <ItemListEditor
                title="Đặc sản mua làm quà"
                icon="🎁"
                namePlaceholder="VD: Cốm làng Vòng"
                items={formData.souvenirs}
                onUpdate={(idx, key, value) => updateItem('souvenirs', idx, key, value)}
                onAdd={() => addItem('souvenirs')}
                onRemove={(idx) => removeItem('souvenirs', idx)}
              />

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-all"
                >Hủy</button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="animate-spin">⏳</span>}
                  {editingId ? '💾 Cập nhật' : '✨ Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
