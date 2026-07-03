'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DestinationMini } from './DestinationMiniCard';

interface Props {
  destinations: DestinationMini[];
}

const categoryIcons: Record<string, string> = {
  beach: '🏖️', mountain: '🏔️', city: '🏙️', countryside: '🌾',
  heritage: '🏛️', nature: '🌿', island: '🏝️', default: '📍',
};

const hasCoords = (d: DestinationMini) =>
  d?.location?.coordinates?.lat != null && d?.location?.coordinates?.lng != null;

// Khoảng cách Haversine (km) giữa 2 toạ độ [lat, lng]
const distKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a[0])) * Math.cos(toRad(b[0]));
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Tối ưu thứ tự ghé thăm để tổng quãng đường ngắn nhất (open-path TSP).
// Giữ nguyên điểm xuất phát (phần tử đầu), rồi Nearest-Neighbor + 2-opt
// để gỡ các đoạn đường cắt chéo nhau → người dùng đi tuần tự, không vòng lại.
const optimizeRoute = (
  items: DestinationMini[],
): DestinationMini[] => {
  const n = items.length;
  if (n <= 2) return items;

  const coords: [number, number][] = items.map(d => [
    d.location.coordinates!.lat!,
    d.location.coordinates!.lng!,
  ]);

  // 1) Nearest-Neighbor từ điểm đầu
  const visited = new Array(n).fill(false);
  const order = [0];
  visited[0] = true;
  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1];
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const d = distKm(coords[last], coords[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    order.push(best);
    visited[best] = true;
  }

  // 2) 2-opt: đảo các đoạn nếu giúp rút ngắn (giữ cố định điểm xuất phát)
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = coords[order[i - 1]];
        const b = coords[order[i]];
        const c = coords[order[j]];
        const next = order[j + 1];
        const before = distKm(a, b) + (next != null ? distKm(c, coords[next]) : 0);
        const after = distKm(a, c) + (next != null ? distKm(b, coords[next]) : 0);
        if (after + 1e-9 < before) {
          let lo = i, hi = j;
          while (lo < hi) { [order[lo], order[hi]] = [order[hi], order[lo]]; lo++; hi--; }
          improved = true;
        }
      }
    }
  }

  return order.map(idx => items[idx]);
};

export default function ChatMap({ destinations }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Khởi tạo map 1 lần
  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    instanceRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    map.setView([16.047, 108.206], 5); // Việt Nam

    // Khi panel đổi kích thước (kéo resize) → báo Leaflet vẽ lại để tile không bị xám/lệch
    const ro = new ResizeObserver(() => {
      instanceRef.current?.invalidateSize();
    });
    ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      instanceRef.current?.remove();
      instanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Vẽ lại markers + route mỗi khi danh sách điểm đến đổi
  useEffect(() => {
    const map = instanceRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const pts = optimizeRoute(destinations.filter(hasCoords));
    if (pts.length === 0) {
      map.setView([16.047, 108.206], 5);
      return;
    }

    const latlngs: [number, number][] = pts.map(d => [
      d.location.coordinates!.lat!,
      d.location.coordinates!.lng!,
    ]);

    // Đường nối lộ trình (chỉ khi ≥2 điểm)
    if (latlngs.length >= 2) {
      L.polyline(latlngs, { color: '#000', weight: 5, opacity: 0.08, smoothFactor: 1.5 }).addTo(layer);
      L.polyline(latlngs, { color: '#3b82f6', weight: 3.5, opacity: 0.9, smoothFactor: 1.5 }).addTo(layer);
      L.polyline(latlngs, { color: '#93c5fd', weight: 1.2, opacity: 0.6, smoothFactor: 1.5 }).addTo(layer);
    }

    pts.forEach((dest, idx) => {
      const coords = dest.location.coordinates!;
      const isFirst = idx === 0;
      const isLast = idx === pts.length - 1;

      const emoji = isFirst ? '🚩' : isLast ? '🏁' : (categoryIcons[dest.category] ?? categoryIcons.default);
      const bg = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#3b82f6';
      const shadow = isFirst ? 'rgba(34,197,94,0.5)' : isLast ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.45)';
      const order = idx + 1;

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:40px;height:40px;cursor:pointer">
            <div style="
              width:40px;height:40px;border-radius:50%;
              background:${bg};
              border:3px solid white;
              box-shadow:0 3px 12px ${shadow};
              display:flex;align-items:center;justify-content:center;
              font-size:18px;font-weight:800;color:white;
              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
              line-height:1;
            ">${order}</div>
            <div style="
              position:absolute;top:-6px;right:-6px;
              width:20px;height:20px;border-radius:50%;
              background:white;border:1.5px solid ${bg};
              box-shadow:0 1px 4px rgba(0,0,0,0.2);
              display:flex;align-items:center;justify-content:center;
              font-size:11px;line-height:1;
            ">${emoji}</div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
      });

      const stars = '⭐'.repeat(Math.round(dest.rating || 0));
      const imgHtml = dest.images?.[0]
        ? `<img src="${dest.images[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px" />`
        : '';

      const popup = L.popup({ maxWidth: 220 }).setContent(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:190px">
          ${imgHtml}
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:2px">${dest.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${dest.location?.city || ''}</div>
          <div style="font-size:12px">${stars} <span style="color:#64748b">${dest.rating || 0}/5</span></div>
          <div style="margin-top:6px;font-size:11px;color:#3b82f6;background:#eff6ff;padding:4px 8px;border-radius:6px;font-weight:600">
            Điểm ${idx + 1}/${pts.length}
          </div>
        </div>
      `);

      L.marker([coords.lat!, coords.lng!], { icon }).addTo(layer).bindPopup(popup);
    });

    // Fit khung nhìn
    if (latlngs.length === 1) {
      map.setView(latlngs[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 13 });
    }
  }, [destinations]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}
