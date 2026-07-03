'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Destination {
  _id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
  };
  images: string[];
  category: string;
  rating: number;
}

const FALLBACK_PLACES = [
  {
    name: 'Vịnh Hạ Long',
    location: 'Quảng Ninh',
    tag: 'Biển đảo',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600',
    summary: 'Du ngoạn giữa những khối đá vôi, làn nước xanh và các hang động nổi tiếng của miền Bắc.',
    highlights: ['Du thuyền', 'Hang động', 'Ngắm hoàng hôn'],
  },
  {
    name: 'Hội An',
    location: 'Quảng Nam',
    tag: 'Di sản',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600',
    summary: 'Phố cổ rực đèn lồng, ẩm thực đậm vị miền Trung và những góc phố hợp cho chuyến đi chậm.',
    highlights: ['Phố cổ', 'Đèn lồng', 'Ẩm thực'],
  },
];

export default function TravelShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [places, setPlaces] = useState(FALLBACK_PLACES);
  const [loading, setLoading] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activePlace = places[activeIndex];

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiUrl}/destinations?limit=15`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          const formattedPlaces = data.data
            .filter((dest: Destination) => dest.images && dest.images.length > 0)
            .map((dest: Destination) => ({
              name: dest.name,
              location: dest.location.city || dest.location.country || 'Việt Nam',
              tag: getCategoryTag(dest.category),
              image: dest.images[0],
              summary: dest.description || 'Khám phá điểm đến tuyệt vời này.',
              highlights: [],
            }));

          if (formattedPlaces.length > 0) {
            setPlaces(formattedPlaces);
          }
        }
      } catch (error) {
        console.error('Error fetching destinations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScrolling && places.length > 1) {
      autoScrollIntervalRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % places.length);
      }, 5000); // Change every 5 seconds

      return () => {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
      };
    }
  }, [isAutoScrolling, places.length]);

  const getCategoryTag = (category: string) => {
    const tags: Record<string, string> = {
      beach: 'Biển đảo',
      mountain: 'Núi rừng',
      city: 'Thành phố',
      countryside: 'Nông thôn',
      historical: 'Di sản',
      temple: 'Tâm linh',
      culture: 'Văn hóa',
      landmark: 'Địa danh',
    };
    return tags[category] || 'Điểm đến';
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 180;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    setIsAutoScrolling(false); // Stop auto-scroll when user interacts
  };

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-white">
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-12 w-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="h-[600px] bg-gray-200 animate-pulse"></div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-sky-50 px-4 py-2 text-sm font-bold text-sky-600 ring-1 ring-sky-100">
                Địa điểm nổi bật
              </span>
              <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
                Chọn điểm đến, xem ngay <span className="gradient-text">cảm hứng chuyến đi</span>
              </h2>
            </div>
            <Link
              href="/destinations"
              className="w-fit rounded-full border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:border-sky-400 hover:text-sky-500"
            >
              Xem tất cả →
            </Link>
          </div>
        </div>
      </div>

      {/* Full Image Showcase */}
      <div className="relative h-[600px] w-full overflow-hidden">
        {/* Background Image */}
        <Image
          key={activePlace.image}
          src={activePlace.image}
          alt={activePlace.name}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-opacity duration-500"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 flex h-full items-end justify-between p-6 sm:p-8 lg:p-12">
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">{activePlace.location}</span>
            </div>

            <h3 className="mb-4 text-5xl font-black uppercase leading-none text-white sm:text-6xl lg:text-7xl">
              {activePlace.name}
            </h3>

            <p className="mb-6 max-w-xl text-base font-medium leading-relaxed text-white/90 sm:text-lg">
              {activePlace.summary}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ai-chat"
                className="rounded-full bg-white px-6 py-3 font-bold text-gray-900 shadow-lg transition-all hover:scale-105"
              >
                Explore
              </Link>
              <button
                onClick={toggleAutoScroll}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-all hover:bg-white hover:text-gray-900"
                title={isAutoScrolling ? 'Tạm dừng' : 'Tự động lướt'}
              >
                {isAutoScrolling ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Right Bottom Cards - Scrollable */}
          <div className="hidden lg:block absolute bottom-6 right-6 left-auto w-auto max-w-[50vw]">
            {/* Scroll Buttons */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-20">
              <button
                onClick={() => scroll('left')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-all hover:bg-white hover:scale-110"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-20">
              <button
                onClick={() => scroll('right')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-all hover:bg-white hover:scale-110"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {places
                .filter((_, index) => index !== activeIndex)
                .map((place) => (
                  <button
                    key={place.name}
                    type="button"
                    onClick={() => handleCardClick(places.indexOf(place))}
                    className="group relative h-[200px] w-[160px] flex-shrink-0 overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-105 snap-start"
                  >
                    <Image
                      src={place.image}
                      alt={place.name}
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {place.location}
                      </p>
                      <p className="text-lg font-black uppercase leading-tight text-white">
                        {place.name}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
