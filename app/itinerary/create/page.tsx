'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

// Leaflet cần window → import động, tắt SSR (theo mẫu explore).
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Đang tải bản đồ...</span>
    </div>
  ),
});

interface Destination {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  category: string;
  rating: number;
  location: { city: string; country: string; coordinates?: { lat: number; lng: number } };
}

const categories = [
  { id: '', label: 'Tất cả', icon: '🌍' },
  { id: 'beach', label: 'Biển', icon: '🏖️' },
  { id: 'mountain', label: 'Núi', icon: '🏔️' },
  { id: 'amusement', label: 'Khu vui chơi', icon: '🎡' },
  { id: 'culture', label: 'Văn hóa', icon: '🏮' },
  { id: 'landmark', label: 'Địa danh', icon: '📸' },
  { id: 'attraction', label: 'Khác', icon: '🎯' },
  { id: 'hotel', label: 'Khách sạn', icon: '🏨' },
  { id: 'restaurant', label: 'Nhà hàng', icon: '🍜' },
  { id: 'cafe', label: 'Cafe', icon: '☕' },
  { id: 'city', label: 'Mua sắm', icon: '🛍️' },
  { id: 'countryside', label: 'Nông thôn', icon: '🌾' },
  { id: 'historical', label: 'Di tích', icon: '🏛️' },
  { id: 'temple', label: 'Chùa & Đền', icon: '⛩️' },
];

// Bỏ dấu để tìm kiếm không phân biệt dấu.
const noTone = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function CreateItineraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [allDests, setAllDests] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selected, setSelected] = useState<Destination[]>([]);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Chưa đăng nhập → về trang login.
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  // Nạp toàn bộ địa điểm (kèm toạ độ) cho bản đồ.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/destinations/map`);
        const data = await res.json();
        if (data.success) setAllDests(data.data);
      } catch (e) {
        console.error('Error loading destinations:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL]);

  // Lọc theo danh mục + tìm kiếm (dùng cho marker bản đồ lẫn danh sách kết quả).
  const filtered = useMemo(() => {
    const q = noTone(searchQuery.trim());
    return allDests.filter((d) => {
      const okCat = !category || d.category === category;
      const okSearch = !q || noTone(d.name).includes(q) || noTone(d.location?.city || '').includes(q);
      return okCat && okSearch;
    });
  }, [allDests, category, searchQuery]);

  const selectedIds = useMemo(() => new Set(selected.map((d) => d._id)), [selected]);

  const addDest = (d: Destination) => {
    setSelected((prev) => (prev.some((x) => x._id === d._id) ? prev : [...prev, d]));
  };
  const removeDest = (id: string) => setSelected((prev) => prev.filter((d) => d._id !== id));

  // Kéo-thả đổi thứ tự trong danh sách đã chọn.
  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (!title.trim() || !startDate || !endDate) { alert('Vui lòng nhập tên lịch trình và ngày.'); return; }
    if (!selected.length) { alert('Hãy chọn ít nhất 1 địa điểm.'); return; }
    if (new Date(endDate) < new Date(startDate)) { alert('Ngày kết thúc phải sau ngày bắt đầu.'); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/itineraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          startDate,
          endDate,
          destinations: selected.map((d, i) => ({ destination: d._id, order: i + 1 })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/itinerary/${data.data._id}`);
      } else {
        alert(data.message || 'Không tạo được lịch trình');
        setSaving(false);
      }
    } catch (e) {
      console.error('Error creating itinerary:', e);
      alert('Có lỗi xảy ra, thử lại nhé.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">✍️ Tự tạo lịch trình</h1>
          <p className="text-gray-500 mt-1">Chọn địa điểm trên bản đồ hoặc tìm kiếm, rồi kéo-thả sắp thứ tự theo ý bạn.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Cột trái: bản đồ + chọn địa điểm ── */}
          <div className="lg:col-span-3 space-y-3">
            {/* Bộ lọc danh mục */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c.id || 'all'}
                  onClick={() => setCategory(c.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === c.id ? 'bg-sky-500 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm địa điểm theo tên hoặc thành phố..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-sky-500"
            />

            {/* Bản đồ */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '60vh' }}>
              {loading ? (
                <div className="h-full flex items-center justify-center bg-gray-100 text-gray-400">Đang tải bản đồ...</div>
              ) : (
                <Map
                  destinations={filtered as never}
                  center={[16.0, 106.0]}
                  zoom={6}
                  height="100%"
                  onMarkerClick={((d: Destination) => addDest(d)) as never}
                />
              )}
            </div>

            {/* Kết quả tìm kiếm (khi có query) — chọn địa điểm ngoài vùng nhìn bản đồ */}
            {searchQuery.trim() && (
              <div className="bg-white rounded-2xl border border-gray-200 divide-y max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">Không tìm thấy địa điểm phù hợp.</p>
                ) : (
                  filtered.slice(0, 30).map((d) => (
                    <div key={d._id} className="flex items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{d.name}</p>
                        <p className="text-xs text-gray-500 truncate">📍 {d.location?.city}</p>
                      </div>
                      <button
                        onClick={() => addDest(d)}
                        disabled={selectedIds.has(d._id)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 disabled:cursor-default bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100"
                      >
                        {selectedIds.has(d._id) ? '✓ Đã thêm' : '＋ Thêm'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Cột phải: lịch trình đang dựng ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:sticky lg:top-24 space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên lịch trình (vd: Cuối tuần Đà Lạt)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Ngày bắt đầu</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ngày kết thúc</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Các điểm đã chọn</h3>
                  <span className="text-sm text-gray-400">{selected.length} điểm</span>
                </div>

                {selected.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    Click marker trên bản đồ hoặc tìm kiếm để thêm địa điểm 📍
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selected.map((d, i) => (
                      <li
                        key={d._id}
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => { if (dragIndex !== null) moveItem(dragIndex, i); setDragIndex(null); }}
                        onDragEnd={() => setDragIndex(null)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border bg-gray-50 cursor-grab active:cursor-grabbing transition-all ${
                          dragIndex === i ? 'opacity-50 border-sky-300' : 'border-gray-200 hover:border-sky-200'
                        }`}
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-gray-400 select-none" title="Kéo để đổi thứ tự">⋮⋮</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">{d.name}</p>
                          <p className="text-xs text-gray-500 truncate">📍 {d.location?.city}</p>
                        </div>
                        <button onClick={() => removeDest(d._id)} className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xoá">✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={saving || !title.trim() || !startDate || !endDate || selected.length === 0}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-violet-600 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang tạo...' : '✅ Tạo lịch trình'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
