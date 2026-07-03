'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TourStop } from '../lib/savedTours';
import { geocodeMany } from '../lib/geocode';

const categoryIcons: Record<string, string> = {
  beach: '🏖️', mountain: '🏔️', city: '🏙️', countryside: '🌾',
  heritage: '🏛️', nature: '🌿', island: '🏝️', default: '📍',
};

interface Props {
  stops: TourStop[];
  height?: number;
}

// Bản đồ thật (Leaflet + CartoDB) cho tour cộng đồng — mô phỏng style của
// ItineraryMap. Vì TourStop không có sẵn toạ độ, component tự geocode runtime
// qua Nominatim (có cache) rồi mới vẽ. Hiển thị thanh tiến trình trong lúc tra.
export default function TourMap({ stops, height = 460 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  // Mỗi phần tử: stop kèm toạ độ đã geocode thành công (giữ nguyên thứ tự gốc).
  const [located, setLocated] = useState<(TourStop & { lat: number; lng: number })[] | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: stops.length });

  // ── Lấy toạ độ cho các trạm khi mount / khi đổi tour ──
  // Ưu tiên toạ độ tĩnh có sẵn trong dữ liệu tour (lấy từ DB). Chỉ những trạm
  // thiếu toạ độ mới geocode runtime qua Nominatim → map thường vẽ tức thì.
  useEffect(() => {
    let cancelled = false;

    // Trạm đã có sẵn coordinates → dùng luôn.
    const ready = stops.map((s) =>
      s.coordinates?.lat != null ? { ...s, lat: s.coordinates.lat, lng: s.coordinates.lng } : null
    );
    const needGeocode = stops
      .map((s, i) => (ready[i] ? null : { ...s, i }))
      .filter((x): x is TourStop & { i: number } => x !== null);

    // Tất cả đã có toạ độ — không cần gọi mạng.
    if (needGeocode.length === 0) {
      setLocated(ready.filter((s): s is TourStop & { lat: number; lng: number } => s !== null));
      return;
    }

    setLocated(null);
    setProgress({ done: 0, total: needGeocode.length });

    (async () => {
      const coords = await geocodeMany(
        needGeocode.map((s) => ({ name: s.name, city: s.city })),
        (done, total) => { if (!cancelled) setProgress({ done, total }); }
      );
      if (cancelled) return;
      // Ghép kết quả geocode trở lại đúng vị trí.
      const filled = [...ready];
      needGeocode.forEach((s, k) => {
        if (coords[k]) filled[s.i] = { ...stops[s.i], lat: coords[k]!.lat, lng: coords[k]!.lng };
      });
      setLocated(filled.filter((s): s is TourStop & { lat: number; lng: number } => s !== null));
    })();

    return () => { cancelled = true; };
  }, [stops]);

  // ── Dựng bản đồ Leaflet sau khi đã có toạ độ ──
  useEffect(() => {
    if (!located || !mapRef.current || instanceRef.current) return;

    const center: [number, number] = located.length > 0
      ? [located[0].lat, located[0].lng]
      : [16.047, 108.206];

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    instanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const latlngs: [number, number][] = located.map((s) => [s.lat, s.lng]);

    if (latlngs.length >= 2) {
      L.polyline(latlngs, { color: '#000', weight: 5, opacity: 0.08, smoothFactor: 1.5 }).addTo(map);
      L.polyline(latlngs, { color: '#3b82f6', weight: 3.5, opacity: 0.9, smoothFactor: 1.5 }).addTo(map);
      L.polyline(latlngs, { color: '#93c5fd', weight: 1.2, opacity: 0.6, smoothFactor: 1.5 }).addTo(map);
    }

    located.forEach((stop, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === located.length - 1;

      const emoji = isFirst ? '🚩' : isLast ? '🏁' : (categoryIcons[stop.category] ?? categoryIcons.default);
      const bg = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#3b82f6';
      const shadow = isFirst ? 'rgba(34,197,94,0.5)' : isLast ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.45)';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:40px;height:40px;border-radius:50%;
            background:${bg};
            border:3px solid white;
            box-shadow:0 3px 12px ${shadow};
            display:flex;align-items:center;justify-content:center;
            font-size:18px;cursor:pointer;
          ">${emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
      });

      const stars = '⭐'.repeat(Math.round(stop.rating || 0));
      const imgHtml = stop.image
        ? `<img src="${stop.image}" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px" />`
        : '';

      const popup = L.popup({ maxWidth: 220 }).setContent(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:200px">
          ${imgHtml}
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:2px">${stop.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${stop.city || ''}</div>
          <div style="font-size:12px">${stars} <span style="color:#64748b">${stop.rating || 0}/5</span></div>
          <div style="margin-top:6px;font-size:11px;color:#3b82f6;background:#eff6ff;padding:4px 8px;border-radius:6px;font-weight:600">
            Trạm ${idx + 1}/${located.length}
          </div>
        </div>
      `);

      L.marker([stop.lat, stop.lng], { icon }).addTo(map).bindPopup(popup);
    });

    if (latlngs.length === 1) {
      map.setView(latlngs[0], 12);
    } else if (latlngs.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
    } else {
      map.setView(center, 7);
    }

    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [located]);

  // ── Trạng thái đang geocode ──
  if (!located) {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100"
        style={{ height }}
      >
        <div className="text-3xl animate-bounce">🗺️</div>
        <p className="text-sm font-semibold text-gray-600">Đang định vị các điểm đến…</p>
        <div className="w-48 h-2 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">{progress.done}/{progress.total} điểm</p>
      </div>
    );
  }

  // ── Không định vị được điểm nào ──
  if (located.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50 border border-gray-100 text-center px-6"
        style={{ height }}
      >
        <div className="text-3xl">🧭</div>
        <p className="text-sm text-gray-400">Chưa định vị được các điểm đến của tour này.</p>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height, width: '100%' }} />;
}
