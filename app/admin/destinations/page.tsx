'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { adminApi } from '../../lib/adminApi';
import DataTable, { Column } from '../_components/DataTable';
import FilterBar from '../_components/FilterBar';
import Pagination from '../_components/Pagination';
import ConfirmModal from '../_components/ConfirmModal';
import BulkActionBar from '../_components/BulkActionBar';
import Badge from '../_components/Badge';
import EmptyState from '../_components/EmptyState';
import { toast } from '../_components/Toast';

const MapPreview = dynamic(() => import('./MapPreview'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Đang tải bản đồ...</span>
    </div>
  ),
});

interface Destination {
  _id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  images: string[];
  category: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
}

const categories = [
  { id: 'beach', label: '🏖️ Biển', color: 'sky' as const },
  { id: 'mountain', label: '🏔️ Núi', color: 'emerald' as const },
  { id: 'city', label: '🌆 Thành phố', color: 'violet' as const },
  { id: 'countryside', label: '🌾 Nông thôn', color: 'amber' as const },
  { id: 'historical', label: '🏛️ Di tích', color: 'rose' as const },
];

const priceRanges = [
  { id: 'budget', label: '💰 Tiết kiệm' },
  { id: 'mid-range', label: '💵 Trung bình' },
  { id: 'luxury', label: '💎 Cao cấp' },
];

const getCategoryMeta = (id: string) =>
  categories.find((c) => c.id === id) || { id, label: id, color: 'gray' as const };

export default function AdminDestinations() {
  const searchParams = useSearchParams();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Destination | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    country: 'Việt Nam',
    coordinates: '',
    images: '',
    category: 'beach',
    priceRange: 'mid-range',
    amenities: '',
    activities: '',
    bestTimeToVisit: '',
  });
  const [previewCoords, setPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<Array<Record<string, string>>>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDestinations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminApi.getDestinations({
      page,
      search,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
    if (error) toast.error(error);
    if (data) {
      const r = data as { destinations: Destination[]; totalPages: number };
      setDestinations(r.destinations);
      setTotalPages(r.totalPages);
    }
    setLoading(false);
  }, [page, search, categoryFilter]);

  useEffect(() => { loadDestinations(); }, [loadDestinations]);

  // Parse coordinates → previewCoords
  useEffect(() => {
    if (!formData.coordinates.trim()) { setPreviewCoords(null); return; }
    const parts = formData.coordinates.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 2) {
      const [lat, lng] = parts;
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setPreviewCoords({ lat, lng });
        return;
      }
    }
    setPreviewCoords(null);
  }, [formData.coordinates]);

  const resetForm = () => {
    setEditingId(null);
    setPreviewCoords(null);
    setFormData({
      name: '', description: '', city: '', country: 'Việt Nam',
      coordinates: '', images: '', category: 'beach', priceRange: 'mid-range',
      amenities: '', activities: '', bestTimeToVisit: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let coordinates: { lat: number; lng: number } | undefined;
    if (formData.coordinates.trim()) {
      const parts = formData.coordinates.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        coordinates = { lat: parts[0], lng: parts[1] };
      }
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      location: { city: formData.city, country: formData.country, coordinates },
      images: formData.images.split(',').map((s) => s.trim()).filter(Boolean),
      category: formData.category,
      priceRange: formData.priceRange,
      amenities: formData.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      activities: formData.activities.split(',').map((s) => s.trim()).filter(Boolean),
      bestTimeToVisit: formData.bestTimeToVisit.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const { error } = editingId
      ? await adminApi.updateDestination(editingId, payload)
      : await adminApi.createDestination(payload);

    setSaving(false);
    if (error) toast.error(error);
    else {
      toast.success(editingId ? 'Đã cập nhật điểm đến' : 'Đã thêm điểm đến mới');
      setShowModal(false);
      resetForm();
      loadDestinations();
    }
  };

  const handleEdit = (dest: Destination) => {
    setEditingId(dest._id);
    setFormData({
      name: dest.name,
      description: dest.description,
      city: dest.location?.city || '',
      country: dest.location?.country || 'Việt Nam',
      coordinates: dest.location?.coordinates
        ? `${dest.location.coordinates.lat}, ${dest.location.coordinates.lng}`
        : '',
      images: dest.images?.join(', ') || '',
      category: dest.category,
      priceRange: dest.priceRange,
      amenities: '', activities: '', bestTimeToVisit: '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    const { error } = await adminApi.deleteDestination(confirmDelete._id);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success(`Đã xóa ${confirmDelete.name}`);
      setConfirmDelete(null);
      loadDestinations();
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    const { data, error } = await adminApi.bulkDeleteDestinations(selectedIds);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      const count = (data as { deletedCount: number })?.deletedCount || 0;
      toast.success(`Đã xóa ${count} điểm đến`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      loadDestinations();
    }
  };

  // ── Excel import ────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' });
        if (jsonData.length === 0) {
          toast.warning('File Excel trống');
          return;
        }
        setImportData(jsonData);
        setShowImportModal(true);
      } catch (err) {
        toast.error('Lỗi đọc file Excel');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mapExcelRowToDestination = (row: Record<string, string>) => {
    const name = row['Tên'] || row['name'] || row['Name'] || '';
    const description = row['Mô tả'] || row['description'] || row['Description'] || '';
    const city = row['Thành phố'] || row['Tỉnh'] || row['city'] || row['City'] || '';
    const country = row['Quốc gia'] || row['country'] || row['Country'] || 'Việt Nam';
    const coordinates = row['Tọa độ'] || row['coordinates'] || row['Coordinates'] || '';
    const images = row['Hình ảnh'] || row['images'] || row['Images'] || '';
    const category = row['Loại'] || row['category'] || row['Category'] || 'beach';
    const priceRange = row['Mức giá'] || row['priceRange'] || row['PriceRange'] || 'mid-range';
    const amenities = row['Tiện ích'] || row['amenities'] || row['Amenities'] || '';
    const activities = row['Hoạt động'] || row['activities'] || row['Activities'] || '';
    const bestTimeToVisit = row['Thời điểm'] || row['bestTimeToVisit'] || row['BestTimeToVisit'] || '';

    let coords: { lat: number; lng: number } | undefined;
    if (coordinates) {
      const parts = coordinates.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        coords = { lat: parts[0], lng: parts[1] };
      }
    }

    let categoryId = category.toLowerCase();
    if (categoryId.includes('biển') || categoryId.includes('beach')) categoryId = 'beach';
    else if (categoryId.includes('núi') || categoryId.includes('mountain')) categoryId = 'mountain';
    else if (categoryId.includes('thành phố') || categoryId.includes('city')) categoryId = 'city';
    else if (categoryId.includes('nông thôn') || categoryId.includes('countryside')) categoryId = 'countryside';
    else if (categoryId.includes('di tích') || categoryId.includes('historical')) categoryId = 'historical';

    let priceId = priceRange.toLowerCase();
    if (priceId.includes('tiết kiệm') || priceId.includes('budget')) priceId = 'budget';
    else if (priceId.includes('trung bình') || priceId.includes('mid')) priceId = 'mid-range';
    else if (priceId.includes('cao cấp') || priceId.includes('luxury')) priceId = 'luxury';

    return {
      name, description,
      location: { city, country, coordinates: coords },
      images: images.split(',').map((s) => s.trim()).filter(Boolean),
      category: categoryId, priceRange: priceId,
      amenities: amenities.split(',').map((s) => s.trim()).filter(Boolean),
      activities: activities.split(',').map((s) => s.trim()).filter(Boolean),
      bestTimeToVisit: bestTimeToVisit.split(',').map((s) => s.trim()).filter(Boolean),
    };
  };

  const handleImportAll = async () => {
    if (importData.length === 0) return;
    setImporting(true);
    setImportProgress({ current: 0, total: importData.length });
    let success = 0, errors = 0;
    for (let i = 0; i < importData.length; i++) {
      const dest = mapExcelRowToDestination(importData[i]);
      if (!dest.name) { errors++; continue; }
      const { error } = await adminApi.createDestination(dest);
      if (error) errors++; else success++;
      setImportProgress({ current: i + 1, total: importData.length });
    }
    setImporting(false);
    setShowImportModal(false);
    setImportData([]);
    if (success > 0) toast.success(`Đã import ${success} điểm đến${errors > 0 ? ` (${errors} lỗi)` : ''}`);
    else toast.error(`Import thất bại (${errors} lỗi)`);
    loadDestinations();
  };

  const downloadTemplate = () => {
    const template = [{
      'Tên': 'Vịnh Hạ Long',
      'Mô tả': 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi',
      'Thành phố': 'Quảng Ninh',
      'Quốc gia': 'Việt Nam',
      'Tọa độ': '20.9101, 107.1839',
      'Hình ảnh': 'https://example.com/image1.jpg, https://example.com/image2.jpg',
      'Loại': 'beach',
      'Mức giá': 'mid-range',
      'Hoạt động': 'Tham quan, Chèo kayak, Lặn biển',
      'Tiện ích': 'Wifi, Nhà hàng, Bãi đỗ xe',
      'Thời điểm': 'Tháng 3, Tháng 4, Tháng 5',
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Điểm đến');
    ws['!cols'] = [
      { wch: 20 }, { wch: 50 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
      { wch: 50 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 25 },
    ];
    XLSX.writeFile(wb, 'mau_diem_den.xlsx');
  };

  const columns: Column<Destination>[] = [
    {
      key: 'name',
      header: 'Địa điểm',
      render: (d) => (
        <div className="flex items-center gap-3 min-w-0">
          {d.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">🏞️</div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{d.name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{d.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Vị trí',
      render: (d) => <span className="text-sm text-gray-700">📍 {d.location?.city || '—'}</span>,
    },
    {
      key: 'coords',
      header: 'Tọa độ',
      render: (d) => d.location?.coordinates ? (
        <span className="text-[11px] font-mono bg-gray-50 border border-gray-100 px-2 py-1 rounded-md text-gray-700">
          {d.location.coordinates.lat.toFixed(3)}, {d.location.coordinates.lng.toFixed(3)}
        </span>
      ) : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'category',
      header: 'Loại',
      render: (d) => {
        const meta = getCategoryMeta(d.category);
        return <Badge color={meta.color}>{meta.label}</Badge>;
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (d) => (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-amber-500">★</span>
          <span className="font-semibold text-gray-700">{d.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-xs text-gray-400">({d.reviewCount || 0})</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(d); }}
            className="px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
          >✏️ Sửa</button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(d); }}
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
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Điểm đến</h2>
          <p className="text-sm text-gray-500 mt-1">Thêm, sửa, xóa các địa điểm du lịch và import hàng loạt từ Excel</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center gap-2 text-sm font-semibold"
          >
            📥 Import Excel
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-violet-500 text-white rounded-xl shadow-md shadow-violet-500/20 hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 text-sm font-semibold"
          >
            ✨ Thêm điểm đến
          </button>
        </div>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Tìm theo tên điểm đến..."
        filters={[
          {
            key: 'category',
            label: 'Loại',
            type: 'select',
            value: categoryFilter,
            onChange: (v) => { setCategoryFilter(v); setPage(1); },
            options: [
              { value: 'all', label: 'Tất cả' },
              ...categories.map((c) => ({ value: c.id, label: c.label })),
            ],
          },
        ]}
        onReset={() => { setSearch(''); setCategoryFilter('all'); setPage(1); }}
      />

      <DataTable<Destination>
        columns={columns}
        rows={destinations}
        getRowId={(d) => d._id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
        emptyState={<EmptyState icon="🏝️" title="Chưa có điểm đến" description="Nhấn ✨ Thêm điểm đến hoặc Import Excel để bắt đầu." />}
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
        title="Xóa điểm đến"
        message={<>Xóa <strong>{confirmDelete?.name}</strong>? Toàn bộ reviews liên quan cũng sẽ bị xóa.</>}
        confirmLabel="Xóa"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa nhiều điểm đến"
        message={<>Sẽ xóa <strong>{selectedIds.length}</strong> điểm đến và toàn bộ reviews liên quan. Không thể hoàn tác.</>}
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
                  {editingId ? '✏️ Sửa điểm đến' : '✨ Thêm điểm đến mới'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Điền thông tin chi tiết</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <section className="space-y-4">
                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-gray-500">📝 Thông tin cơ bản</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên địa điểm *</label>
                    <input
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="VD: Vịnh Hạ Long"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tỉnh/Thành phố *</label>
                    <input
                      type="text" required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="VD: Quảng Ninh"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả *</label>
                  <textarea
                    value={formData.description} required rows={3}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    placeholder="Mô tả chi tiết..."
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">📍 Tọa độ & Bản đồ</h4>
                <input
                  type="text"
                  value={formData.coordinates}
                  onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                  placeholder="VD: 20.9101, 107.1839"
                />
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <MapPreview
                    lat={previewCoords?.lat ?? 16.0544}
                    lng={previewCoords?.lng ?? 108.2022}
                    name={formData.name || 'Vị trí mới'}
                    editable={true}
                    onCoordinatesChange={(lat, lng) => {
                      setFormData({ ...formData, coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
                    }}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">🖼 Hình ảnh</h4>
                <textarea
                  value={formData.images} rows={2}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-xs resize-none"
                  placeholder="URLs cách nhau bằng dấu phẩy"
                />
                {formData.images && (
                  <div className="flex gap-2 flex-wrap">
                    {formData.images.split(',').map((url, idx) => {
                      const u = url.trim();
                      if (!u) return null;
                      // eslint-disable-next-line @next/next/no-img-element
                      return <img key={idx} src={u} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />;
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">🏷 Phân loại & Giá</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại hình</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mức giá</label>
                    <select
                      value={formData.priceRange}
                      onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {priceRanges.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">🎯 Hoạt động & Tiện ích</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hoạt động (phẩy)</label>
                    <input
                      type="text" value={formData.activities}
                      onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Tắm biển, Lướt sóng..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiện ích (phẩy)</label>
                    <input
                      type="text" value={formData.amenities}
                      onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Wifi, Bãi đỗ xe..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời điểm tốt nhất (phẩy)</label>
                  <input
                    type="text" value={formData.bestTimeToVisit}
                    onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Tháng 3, Tháng 4..."
                  />
                </div>
              </section>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-all"
                >Hủy</button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-sky-500 to-violet-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/30 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="animate-spin">⏳</span>}
                  {editingId ? '💾 Cập nhật' : '✨ Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── IMPORT MODAL ──────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">📥 Import từ Excel</h3>
                <p className="text-sm text-gray-500 mt-0.5">Xem trước {importData.length} dòng dữ liệu</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadTemplate}
                  className="px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition-colors"
                >📄 Tải file mẫu</button>
                <button
                  onClick={() => { setShowImportModal(false); setImportData([]); }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {importing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-700 font-semibold">
                    Đang import... {importProgress.current}/{importProgress.total}
                  </p>
                  <div className="w-64 h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Tên</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Thành phố</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Tọa độ</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Loại</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {importData.slice(0, 50).map((row, idx) => {
                        const dest = mapExcelRowToDestination(row);
                        const isValid = !!dest.name;
                        return (
                          <tr key={idx} className={isValid ? '' : 'bg-red-50/50'}>
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-semibold text-gray-900">{dest.name || '—'}</td>
                            <td className="px-3 py-2">{dest.location.city || '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {dest.location.coordinates
                                ? `${dest.location.coordinates.lat.toFixed(3)}, ${dest.location.coordinates.lng.toFixed(3)}`
                                : '—'}
                            </td>
                            <td className="px-3 py-2">{getCategoryMeta(dest.category).label}</td>
                            <td className="px-3 py-2">
                              {isValid
                                ? <Badge color="emerald" size="sm">✓ Hợp lệ</Badge>
                                : <Badge color="rose" size="sm">✗ Thiếu tên</Badge>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {importData.length > 50 && (
                    <p className="text-center text-gray-500 py-4 text-sm">
                      ... và {importData.length - 50} dòng khác sẽ được import
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-gray-500 max-w-md">
                💡 Cột hỗ trợ: Tên, Mô tả, Thành phố, Quốc gia, Tọa độ, Hình ảnh, Loại, Mức giá, Hoạt động, Tiện ích, Thời điểm
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowImportModal(false); setImportData([]); }}
                  disabled={importing}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm disabled:opacity-50"
                >Hủy</button>
                <button
                  onClick={handleImportAll}
                  disabled={importing || importData.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && <span className="animate-spin">⏳</span>}
                  ✨ Import {importData.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
