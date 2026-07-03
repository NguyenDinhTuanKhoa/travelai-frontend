'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import FallbackImage from './FallbackImage';

export interface DestinationMini {
  _id: string;
  name: string;
  images: string[];
  location: { city: string; country: string; coordinates?: { lat: number; lng: number } };
  category: string;
  rating: number;
  priceRange?: string;
  description?: string;
}

const categoryMap: Record<string, { label: string; icon: string; color: string }> = {
  beach:     { label: 'Biển', icon: '🏖️', color: 'bg-sky-100 text-sky-700' },
  mountain:  { label: 'Núi', icon: '🏔️', color: 'bg-emerald-100 text-emerald-700' },
  city:      { label: 'Thành phố', icon: '🏙️', color: 'bg-violet-100 text-violet-700' },
  heritage:  { label: 'Di tích', icon: '🏛️', color: 'bg-amber-100 text-amber-700' },
  nature:    { label: 'Thiên nhiên', icon: '🌿', color: 'bg-green-100 text-green-700' },
  island:    { label: 'Đảo', icon: '🏝️', color: 'bg-teal-100 text-teal-700' },
  countryside: { label: 'Nông thôn', icon: '🌾', color: 'bg-lime-100 text-lime-700' },
};

const priceMap: Record<string, string> = {
  budget: '💰 Tiết kiệm',
  'mid-range': '💵 Trung bình',
  luxury: '💎 Cao cấp',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-xs ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

interface Props {
  destination: DestinationMini;
  onLoginRequired?: () => void;
}

export default function DestinationMiniCard({ destination, onLoginRequired }: Props) {
  const { user, token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cat = categoryMap[destination.category] || { label: destination.category, icon: '📍', color: 'bg-gray-100 text-gray-700' };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token) {
      onLoginRequired?.();
      return;
    }
    if (saved || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recommendations/save/${destination._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSaved(true);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="group relative flex items-stretch gap-0 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all duration-300 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 min-w-[240px] max-w-[280px]">
      {/* Image */}
      <div className="relative w-20 shrink-0 overflow-hidden">
        <FallbackImage
          images={destination.images || []}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          fallbackIcon={cat.icon}
        />
        {/* Category badge overlay */}
        <div className="absolute bottom-1.5 left-1.5 text-sm">{cat.icon}</div>
      </div>

      {/* Info */}
      <div className="flex-1 px-3 py-2.5 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{destination.name}</p>
          <p className="text-gray-500 text-xs truncate mt-0.5">{destination.location?.city}</p>
          <StarRating rating={destination.rating} />
          {destination.priceRange && (
            <p className="text-gray-400 text-[10px] mt-1">{priceMap[destination.priceRange] || destination.priceRange}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2">
          <Link
            href={`/destinations/${destination._id}`}
            target="_blank"
            className="flex-1 text-center text-[10px] font-bold py-1 px-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-all border border-sky-100 hover:border-sky-200"
            onClick={e => e.stopPropagation()}
          >
            Xem chi tiết
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-[10px] py-1 px-2 rounded-lg transition-all border font-bold shrink-0 ${
              saved
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-red-500 border-gray-200 hover:border-red-200'
            }`}
            title={saved ? 'Đã lưu' : 'Lưu điểm đến'}
          >
            {saving ? '⏳' : saved ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}
