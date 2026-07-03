'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Destination {
  _id: string;
  name: string;
  images: string[];
  location: { city: string; country: string; coordinates?: { lat: number; lng: number } };
  category: string;
  rating: number;
}

interface ItineraryDestination {
  destination: Destination;
  order: number;
  notes: string;
  activities: string[];
}

interface Props {
  dests: ItineraryDestination[];
  displayDests: ItineraryDestination[];
  activeNode: number | null;
  onNodeClick: (idx: number | null) => void;
}

const categoryIcons: Record<string, string> = {
  beach: '🏖️', mountain: '🏔️', city: '🏙️', countryside: '🌾',
  heritage: '🏛️', nature: '🌿', island: '🏝️', default: '📍',
};

export default function ItineraryMap({ dests, displayDests, activeNode, onNodeClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  // mỗi phần tử: { marker, originalIdx } — originalIdx là index trong `dests` (thứ tự gốc)
  const markersRef = useRef<{ marker: L.Marker; originalIdx: number }[]>([]);
  // refs để callback luôn đọc giá trị mới nhất mà không cần re-init map
  const activeRef = useRef(activeNode);
  const clickRef = useRef(onNodeClick);
  activeRef.current = activeNode;
  clickRef.current = onNodeClick;

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const withCoords = displayDests.filter(
      item => item.destination?.location?.coordinates?.lat != null
    );

    const center: [number, number] = withCoords.length > 0
      ? [withCoords[0].destination.location.coordinates!.lat!, withCoords[0].destination.location.coordinates!.lng!]
      : [16.047, 108.206];

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    instanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const latlngs: [number, number][] = withCoords.map(item => [
      item.destination.location.coordinates!.lat!,
      item.destination.location.coordinates!.lng!,
    ]);

    if (latlngs.length >= 2) {
      L.polyline(latlngs, { color: '#000', weight: 5, opacity: 0.08, smoothFactor: 1.5 }).addTo(map);
      L.polyline(latlngs, { color: '#3b82f6', weight: 3.5, opacity: 0.9, smoothFactor: 1.5 }).addTo(map);
      L.polyline(latlngs, { color: '#93c5fd', weight: 1.2, opacity: 0.6, smoothFactor: 1.5 }).addTo(map);
    }

    withCoords.forEach((item, idx) => {
      const dest = item.destination;
      const coords = dest.location.coordinates!;
      const isFirst = idx === 0;
      const isLast = idx === withCoords.length - 1;
      const originalIdx = dests.findIndex(d => d.destination?._id === dest._id);

      const emoji = isFirst ? '🚩' : isLast ? '🏁' : (categoryIcons[dest.category] ?? categoryIcons.default);
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

      const stars = '⭐'.repeat(Math.round(dest.rating || 0));
      const imgHtml = dest.images?.[0]
        ? `<img src="${dest.images[0]}" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px" />`
        : '';

      const popup = L.popup({ maxWidth: 220 }).setContent(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:200px">
          ${imgHtml}
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:2px">${dest.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${dest.location?.city || ''}</div>
          <div style="font-size:12px">${stars} <span style="color:#64748b">${dest.rating || 0}/5</span></div>
          <div style="margin-top:6px;font-size:11px;color:#3b82f6;background:#eff6ff;padding:4px 8px;border-radius:6px;font-weight:600">
            Trạm ${idx + 1}/${withCoords.length}
          </div>
        </div>
      `);

      const marker = L.marker([coords.lat!, coords.lng!], { icon }).addTo(map).bindPopup(popup);
      marker.on('click', () => clickRef.current(originalIdx === activeRef.current ? null : originalIdx));
      markersRef.current.push({ marker, originalIdx });
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
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mở popup khi activeNode đổi từ bên ngoài (vd bấm trong danh sách trạm)
  useEffect(() => {
    if (!instanceRef.current) return;
    markersRef.current.forEach(({ marker, originalIdx }) => {
      if (originalIdx === activeNode) marker.openPopup();
      else marker.closePopup();
    });
  }, [activeNode]);

  return (
    <div ref={mapRef} style={{ height: 460, width: '100%' }} />
  );
}
