'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface Destination {
  _id: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  rating: number;
  reviewCount?: number;
  priceRange?: string;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface MapProps {
  destinations?: Destination[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (dest: Destination) => void;
  selectedId?: string;
}

const categoryIcons: Record<string, string> = {
  beach: '🏖️',
  mountain: '🏔️',
  amusement: '🎡',
  culture: '🏮',
  landmark: '📸',
  attraction: '🎯',
  hotel: '🏨',
  restaurant: '🍜',
  cafe: '☕',
  city: '🛍️',
  countryside: '🌾',
  historical: '🏛️',
  temple: '⛩️',
};

const categoryColors: Record<string, string> = {
  beach: '#0ea5e9',
  mountain: '#10b981',
  amusement: '#d946ef',
  culture: '#eab308',
  landmark: '#06b6d4',
  attraction: '#22c55e',
  hotel: '#3b82f6',
  restaurant: '#f97316',
  cafe: '#a16207',
  city: '#8b5cf6',
  countryside: '#f59e0b',
  historical: '#ef4444',
  temple: '#dc2626',
};

export default function MapComponent({ 
  destinations = [], 
  center = [16.0, 106.0], 
  zoom = 6,
  height = '500px',
  onMarkerClick,
  selectedId
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const isUnmountedRef = useRef(false);

  // Store callbacks in refs to avoid dependency issues
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  // Initialize map once
  useEffect(() => {
    isUnmountedRef.current = false;

    if (!mapContainerRef.current) return;

    const mapInstance = L.map(mapContainerRef.current, {
      preferCanvas: true,
    }).setView(center, zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance);

    mapRef.current = mapInstance;

    // 🇻🇳 Quần đảo Hoàng Sa & Trường Sa
    const islandMarkers = [
      { name: 'Quần đảo Hoàng Sa', lat: 16.5, lng: 112.0 },
      { name: 'Quần đảo Trường Sa', lat: 8.6, lng: 111.9 },
    ];

    islandMarkers.forEach(({ name, lat, lng }) => {
      const flagSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 30 20" style="display:block; border:1.5px solid rgba(255,255,255,0.85); border-radius:3px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45));">
          <rect width="30" height="20" fill="#DA251D"/>
          <polygon points="15,5 16.12,8.45 19.76,8.45 16.82,10.59 17.94,14.05 15,11.91 12.06,14.05 13.18,10.59 10.24,8.45 13.88,8.45" fill="#FFFF00"/>
        </svg>
      `;
      const flagIcon = L.divIcon({
        className: 'island-flag-marker',
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
          ">
            ${flagSvg}
            <span style="
              background: rgba(204, 0, 0, 0.9);
              color: white;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 700;
              font-family: system-ui;
              white-space: nowrap;
              margin-top: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 1.5px solid rgba(255,255,255,0.8);
            ">${name}</span>
          </div>
        `,
        iconSize: [140, 60],
        iconAnchor: [70, 30],
      });

      L.marker([lat, lng], { icon: flagIcon, interactive: false, zIndexOffset: 1000 })
        .addTo(mapInstance);
    });

    return () => {
      isUnmountedRef.current = true;
      if (clusterGroupRef.current) {
        try { clusterGroupRef.current.clearLayers(); } catch {}
      }
      clusterGroupRef.current = null;
      mapRef.current = null;
      mapInstance.remove();
    };
  }, []);

  // Cancellation token for updateMarkers
  const updateTokenRef = useRef<number>(0);

  // Build markers function
  const updateMarkers = useCallback((mapInstance: L.Map, dests: Destination[], selId?: string) => {
    if (isUnmountedRef.current) return;

    // Bump token to cancel any previous in-flight update
    const myToken = ++updateTokenRef.current;

    // Safely remove old cluster group
    if (clusterGroupRef.current) {
      try {
        clusterGroupRef.current.clearLayers();
        mapInstance.removeLayer(clusterGroupRef.current);
      } catch {
        // Ignore errors from stale references
      }
      clusterGroupRef.current = null;
    }

    // Create MarkerClusterGroup
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: (zoom: number) => {
        // Larger radius = markers cluster more aggressively = more visible clusters
        return zoom <= 5 ? 60 : zoom <= 7 ? 50 : zoom <= 9 ? 40 : 60;
      },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 13,
      chunkedLoading: false, // Disabled: caused race condition where in-flight chunks
                              // added markers to destroyed cluster groups, silently
                              // dropping all markers in regions like Tây Nguyên
      animate: false, // Disable cluster animation to prevent _leaflet_pos errors
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let diameter = 40;
        if (count >= 100) diameter = 56;
        else if (count >= 30) diameter = 48;

        // Count categories in this cluster
        const catCount: Record<string, number> = {};
        const childMarkers = cluster.getAllChildMarkers();
        childMarkers.forEach((m: any) => {
          const cat = m.options._category || 'attraction';
          catCount[cat] = (catCount[cat] || 0) + 1;
        });

        // Find dominant category
        let dominantCat = 'attraction';
        let maxCount = 0;
        Object.entries(catCount).forEach(([cat, c]) => {
          if (c > maxCount) { maxCount = c; dominantCat = cat; }
        });

        const icon = categoryIcons[dominantCat] || '📍';
        const color = categoryColors[dominantCat] || '#6b7280';
        const iconSize = diameter >= 56 ? '18px' : diameter >= 48 ? '16px' : '14px';
        const numSize = diameter >= 56 ? '11px' : diameter >= 48 ? '10px' : '9px';

        return L.divIcon({
          html: `<div style="
            background: ${color};
            width: ${diameter}px;
            height: ${diameter}px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0px;
            box-shadow: 0 4px 15px ${color}80;
            border: 3px solid rgba(255,255,255,0.9);
          ">
            <span style="font-size:${iconSize};line-height:1;">${icon}</span>
            <span style="color:white;font-weight:700;font-size:${numSize};line-height:1;font-family:system-ui;">${count}</span>
          </div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(diameter, diameter),
          iconAnchor: L.point(diameter / 2, diameter / 2),
        });
      }
    });

    // Build markers
    const markers: L.Marker[] = [];
    
    dests.forEach((dest) => {
      if (!dest.location?.coordinates?.lat || !dest.location?.coordinates?.lng) return;

      const { lat, lng } = dest.location.coordinates;
      
      const hasMountainInName = dest.name.toLowerCase().includes('núi') || 
                                 dest.name.toLowerCase().includes('nui');
      const displayCategory = hasMountainInName ? 'mountain' : dest.category;
      
      const color = categoryColors[displayCategory] || '#6b7280';
      const icon = categoryIcons[displayCategory] || '📍';
      const isSelected = dest._id === selId;

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${isSelected ? '#1e40af' : color};
            width: ${isSelected ? '44px' : '32px'};
            height: ${isSelected ? '44px' : '32px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '20px' : '14px'};
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: pointer;
            ${isSelected ? 'transform: scale(1.2); z-index: 9999;' : ''}
          ">
            ${icon}
          </div>
        `,
        iconSize: [isSelected ? 44 : 32, isSelected ? 44 : 32],
        iconAnchor: [isSelected ? 22 : 16, isSelected ? 22 : 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon, _category: displayCategory } as any);
      
      // Build fallback image sources (images[0] -> images[1] -> ...)
      const allImgSrcs = dest.images.slice(0, 3).map(s => s.replace(/'/g, "\\'"));
      const fallbackScript = allImgSrcs.length > 1
        ? `this._fi=(this._fi||0)+1; if(this._fi<${allImgSrcs.length}){var srcs=${JSON.stringify(allImgSrcs)};this.src=srcs[this._fi];}else{this.style.display='none';}`
        : `this.style.display='none';`;

      // Lazy popup
      marker.bindPopup(() => {
        return `
          <div style="min-width: 200px; font-family: system-ui;">
            <img src="${dest.images[0]}" alt="${dest.name}" 
              style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" 
              loading="lazy"
              onerror="${fallbackScript.replace(/"/g, '&quot;')}" />
            <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${dest.name}</h3>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">📍 ${dest.location.city}</p>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #eab308;">★</span>
              <span style="font-weight: 600;">${dest.rating}</span>
              <span style="color: #9ca3af; margin-left: 8px; font-size: 12px;">${icon} ${dest.category}</span>
            </div>
          </div>
        `;
      }, { maxWidth: 250 });
      
      marker.on('click', () => {
        if (onMarkerClickRef.current) onMarkerClickRef.current(dest);
      });

      markers.push(marker);
    });

    // Bail out if a newer update was triggered or map is gone
    if (isUnmountedRef.current || updateTokenRef.current !== myToken) return;
    if (!mapInstance.getContainer()) return;

    try {
      clusterGroup.addLayers(markers);
      // One final check before committing to the map
      if (isUnmountedRef.current || updateTokenRef.current !== myToken) return;
      mapInstance.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    } catch (err) {
      console.warn('[Map] Failed to add cluster layer:', err);
    }
  }, []);

  // Update markers when destinations or selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    updateMarkers(mapRef.current, destinations, selectedId);
  }, [destinations, selectedId, updateMarkers]);

  // Pan to selected destination
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const dest = destinations.find(d => d._id === selectedId);
    if (dest?.location?.coordinates) {
      mapRef.current.setView(
        [dest.location.coordinates.lat, dest.location.coordinates.lng], 
        12, 
        { animate: true }
      );
    }
  }, [selectedId, destinations]);

  return (
    <>
      <style jsx global>{`
        .custom-marker { background: transparent !important; border: none !important; }
        .custom-cluster-icon { background: transparent !important; border: none !important; }
        .island-flag-marker { background: transparent !important; border: none !important; }
        .marker-cluster { background: transparent !important; }
        .marker-cluster div { background: transparent !important; }
        .leaflet-marker-icon { transition: transform 0.15s ease; }
        .leaflet-marker-icon:hover { transform: scale(1.15); z-index: 9999 !important; }
      `}</style>
      <div 
        ref={mapContainerRef}
        id="map-container" 
        style={{ height, width: '100%', borderRadius: '16px', zIndex: 1 }}
      />
    </>
  );
}
