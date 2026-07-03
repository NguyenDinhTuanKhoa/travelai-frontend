'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState } from 'react';

interface Destination {
  _id?: string;
  name: string;
  description?: string;
  location?: {
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    }
  };
}

export default function OSMMap({ destinations }: { destinations: Destination[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-96 bg-gray-100 flex items-center justify-center">Loading Map...</div>;

  const validDestinations = destinations.filter(d => 
    d.location?.coordinates?.lat && d.location?.coordinates?.lng
  );

  const defaultCenter: [number, number] = validDestinations.length > 0 
    ? [validDestinations[0].location!.coordinates!.lat, validDestinations[0].location!.coordinates!.lng]
    : [14.0583, 108.2772]; // Center of Vietnam

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        key={`${defaultCenter[0]}-${defaultCenter[1]}`} 
        center={defaultCenter} 
        zoom={6} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validDestinations.map((dest, idx) => (
          <Marker 
            key={dest._id || idx} 
            position={[dest.location!.coordinates!.lat, dest.location!.coordinates!.lng]}
          >
            <Popup>
              <strong>{dest.name}</strong><br/>
              {dest.location?.city && <span>{dest.location.city}</span>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}