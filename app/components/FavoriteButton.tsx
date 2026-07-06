'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  loadSavedIds,
  isDestinationSaved,
  toggleSavedDestination,
  SAVED_DESTINATIONS_EVENT,
} from '../lib/savedDestinations';

// Nút "thích" (lưu) địa điểm — tái dùng ở trang chủ, /destinations... Tự quản trạng thái,
// đồng bộ qua event nên thích ở trang này → trang khác cũng cập nhật. Dùng HỆ A (/saved).
export default function FavoriteButton({
  destinationId,
  className = 'absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all shadow-lg',
  size = 'w-5 h-5',
}: {
  destinationId: string;
  className?: string;
  size?: string;
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Nạp danh sách đã lưu (1 lần) + phản chiếu trạng thái; lắng nghe event để đồng bộ.
  useEffect(() => {
    if (user && token) loadSavedIds(token);
    const sync = () => setSaved(isDestinationSaved(destinationId));
    sync();
    window.addEventListener(SAVED_DESTINATIONS_EVENT, sync);
    return () => window.removeEventListener(SAVED_DESTINATIONS_EVENT, sync);
  }, [destinationId, user, token]);

  const handleClick = async (e: React.MouseEvent) => {
    // Card bọc trong <Link> → chặn điều hướng khi bấm tim.
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token) { router.push('/login'); return; }
    if (busy) return;
    setBusy(true);
    const prev = saved;
    setSaved(!prev); // optimistic
    try {
      const now = await toggleSavedDestination(destinationId, token);
      setSaved(now);
    } catch {
      setSaved(prev); // lỗi → revert
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      title={saved ? 'Bỏ thích' : 'Thích'}
      className={`${className} ${saved ? 'text-red-500' : 'text-gray-700 hover:bg-red-500 hover:text-white'}`}
    >
      <svg className={size} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
