// Geocode tên địa danh → toạ độ lat/lng qua Nominatim (OpenStreetMap).
// Dùng cho các tour cộng đồng (/my-tours) — dữ liệu hardcode không có sẵn toạ độ.
// Kết quả được cache trong localStorage để lần mở sau không phải gọi lại API.

export interface LatLng { lat: number; lng: number }

const CACHE_KEY = 'geocodeCache';

function loadCache(): Record<string, LatLng> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, LatLng>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, LatLng>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage đầy hoặc bị chặn — bỏ qua, lần sau geocode lại */
  }
}

async function queryNominatim(q: string): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    /* lỗi mạng — trả null để bỏ qua điểm này */
  }
  return null;
}

// Tra toạ độ cho 1 địa danh. Thử "tên + thành phố" trước, nếu không có thì lùi về
// trung tâm thành phố. Chỉ cache khi thành công (để lỗi tạm thời còn thử lại sau).
// Trả về { coords, cached } — `cached=true` nghĩa là lấy từ cache, không gọi mạng.
export async function geocodePlace(
  name: string,
  city: string
): Promise<{ coords: LatLng | null; cached: boolean }> {
  const key = `${name}|${city}`.toLowerCase();
  const cache = loadCache();
  if (cache[key]) return { coords: cache[key], cached: true };

  const coords =
    (await queryNominatim(`${name}, ${city}, Việt Nam`)) ??
    (await queryNominatim(`${city}, Việt Nam`));

  if (coords) {
    cache[key] = coords;
    saveCache(cache);
  }
  return { coords, cached: false };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Geocode tuần tự một danh sách địa danh, tôn trọng rate-limit của Nominatim
// (~1 req/giây) — chỉ chờ giữa các lần thực sự gọi mạng, cache thì lấy ngay.
// `onProgress(done, total)` được gọi sau mỗi điểm để cập nhật thanh tiến trình.
export async function geocodeMany(
  places: { name: string; city: string }[],
  onProgress?: (done: number, total: number) => void
): Promise<(LatLng | null)[]> {
  const results: (LatLng | null)[] = [];
  for (let i = 0; i < places.length; i++) {
    const { coords, cached } = await geocodePlace(places[i].name, places[i].city);
    results.push(coords);
    onProgress?.(i + 1, places.length);
    if (!cached && i < places.length - 1) await sleep(1100);
  }
  return results;
}
