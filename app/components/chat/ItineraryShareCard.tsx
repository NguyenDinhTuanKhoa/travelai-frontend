'use client';
import Link from 'next/link';
import Image from 'next/image';

interface ItineraryShared {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  destinations: Array<{ destination?: { _id: string; name: string; images?: string[]; location?: { city?: string } } }>;
}

export default function ItineraryShareCard({ itinerary }: { itinerary: ItineraryShared }) {
  const days = (() => {
    const s = new Date(itinerary.startDate);
    const e = new Date(itinerary.endDate);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const previewDests = itinerary.destinations.slice(0, 3);
  const cover = previewDests[0]?.destination?.images?.[0];

  return (
    <Link
      href={`/itinerary/${itinerary._id}?shared=1`}
      className="block w-72 max-w-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-sky-300 transition-all"
    >
      <div className="relative h-32 bg-gradient-to-br from-sky-400 to-violet-500">
        {cover && (
          <Image src={cover} alt={itinerary.title} fill className="object-cover" sizes="288px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-0.5">🗺️ Lịch trình</p>
          <h4 className="text-white font-bold text-sm leading-tight line-clamp-2">{itinerary.title}</h4>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium">📅 {days} ngày</span>
          <span className="text-gray-500">{itinerary.destinations.length} điểm dừng</span>
        </div>
        {previewDests.length > 0 && (
          <p className="text-xs text-gray-500 truncate">
            {previewDests.map(d => d.destination?.name).filter(Boolean).join(' · ')}
            {itinerary.destinations.length > 3 && ` +${itinerary.destinations.length - 3}`}
          </p>
        )}
        <div className="pt-2 border-t border-gray-100 text-center">
          <span className="text-sky-600 text-xs font-semibold">Xem chi tiết →</span>
        </div>
      </div>
    </Link>
  );
}
