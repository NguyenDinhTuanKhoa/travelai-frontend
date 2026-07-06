// Quản lý "điểm đến đã lưu/thích" — HỆ A: User.savedDestinations qua API /saved.
// Đây là hệ mà trang "Đã lưu" (/saved) và Profile hiển thị, và trang chi tiết dùng.
// Cache in-memory + event để mọi nút tim (trang chủ, /destinations) đồng bộ tức thì.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const EVENT = 'savedDestinationsChanged';

// Set ID đã lưu (cache). `loaded` để chỉ GET /saved 1 lần cho mỗi phiên đăng nhập.
const savedIds = new Set<string>();
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export const SAVED_DESTINATIONS_EVENT = EVENT;

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT));
}

// Nạp danh sách ID đã lưu từ server (idempotent). Gọi khi đã đăng nhập.
export async function loadSavedIds(token: string): Promise<void> {
  if (loaded || !token || !API_URL) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/saved`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        for (const d of data.data) {
          const id = typeof d === 'string' ? d : d?._id;
          if (id) savedIds.add(String(id));
        }
      }
      loaded = true;
      emit();
    } catch {
      // Lỗi mạng → để loaded=false cho lần sau thử lại
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

export function isDestinationSaved(id: string): boolean {
  return savedIds.has(String(id));
}

// Toggle lưu/bỏ lưu qua API /saved/:id (backend tự toggle). Trả trạng thái MỚI (true=đã lưu).
export async function toggleSavedDestination(id: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/saved/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Toggle save failed');
  const nowSaved = !!data.data?.saved;
  if (nowSaved) savedIds.add(String(id));
  else savedIds.delete(String(id));
  emit();
  return nowSaved;
}

// Reset cache khi đăng xuất / đổi user.
export function clearSavedIds() {
  savedIds.clear();
  loaded = false;
  loadingPromise = null;
  emit();
}
