'use client';
import { useState, useEffect } from 'react';

// Modal "Thêm vào lịch trình" dùng chung: chọn lịch trình có sẵn hoặc tạo mới rồi thêm địa
// điểm vào. Tách từ luồng inline ở trang chi tiết (/destinations/[id]) để tái dùng ở trang
// Đã lưu (/saved). Mở khi destinationId != null.
interface Itinerary {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  destinations: unknown[];
}

export default function AddToItineraryModal({
  destinationId,
  onClose,
}: {
  destinationId: string | null;
  onClose: () => void;
}) {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [newItinerary, setNewItinerary] = useState({ title: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const loadItineraries = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/itineraries`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setItineraries(data.data);
    } catch (error) {
      console.error('Error loading itineraries:', error);
    }
  };

  // Nạp danh sách lịch trình mỗi khi mở modal (destinationId chuyển từ null → có).
  useEffect(() => {
    if (destinationId) {
      loadItineraries();
      setNewItinerary({ title: '', startDate: '', endDate: '' });
    }
  }, [destinationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToItinerary = async (itineraryId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !destinationId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/itineraries/${itineraryId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ destinationId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã thêm vào lịch trình!');
        onClose();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error adding to itinerary:', error);
    }
    setSaving(false);
  };

  const handleCreateItinerary = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newItinerary.title || !newItinerary.startDate || !newItinerary.endDate) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSaving(true);
    try {
      const createRes = await fetch(`${API_URL}/itineraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newItinerary),
      });
      const createData = await createRes.json();
      if (createData.success) {
        // Thêm địa điểm vào lịch trình vừa tạo (handleAddToItinerary tự đóng modal).
        await handleAddToItinerary(createData.data._id);
      } else {
        alert(createData.message || 'Không tạo được lịch trình');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error creating itinerary:', error);
      setSaving(false);
    }
  };

  if (!destinationId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Thêm vào lịch trình</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Lịch trình hiện có */}
          {itineraries.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Lịch trình hiện có</h4>
              <div className="space-y-2">
                {itineraries.map((it) => (
                  <button
                    key={it._id}
                    onClick={() => handleAddToItinerary(it._id)}
                    disabled={saving}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-all disabled:opacity-50"
                  >
                    <p className="font-medium text-gray-900">{it.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(it.startDate).toLocaleDateString('vi-VN')} - {new Date(it.endDate).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{it.destinations.length} điểm đến</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tạo lịch trình mới */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Tạo lịch trình mới</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tên lịch trình"
                value={newItinerary.title}
                onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={newItinerary.startDate}
                    onChange={(e) => setNewItinerary({ ...newItinerary, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={newItinerary.endDate}
                    onChange={(e) => setNewItinerary({ ...newItinerary, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateItinerary}
                disabled={saving || !newItinerary.title || !newItinerary.startDate || !newItinerary.endDate}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Tạo và thêm điểm đến'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
