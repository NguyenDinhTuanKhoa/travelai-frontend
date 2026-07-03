'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Destination {
  _id: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  location: {
    city: string;
    country: string;
  };
}

const categoryTags: Record<string, string> = {
  beach: 'Biển',
  mountain: 'Núi',
  city: 'Thành phố',
  countryside: 'Nông thôn',
  historical: 'Di tích',
  temple: 'Chùa & Đền',
  hotel: 'Khách sạn',
  restaurant: 'Nhà hàng',
  cafe: 'Quán Cafe',
  amusement: 'Khu vui chơi',
  culture: 'Văn hóa',
  landmark: 'Địa danh',
};

const priceLabels: Record<string, string> = {
  budget: 'Từ 1.5tr',
  'mid-range': 'Từ 2.5tr',
  luxury: 'Từ 5tr',
};

const searchSuggestions = [
  'Biển đẹp gần Sài Gòn...',
  'Du lịch Đà Nẵng 3 ngày...',
  'Khách sạn view đẹp Đà Lạt...',
  'Tour Phú Quốc giá rẻ...',
  'Ăn gì ở Hội An...',
  'Sapa mùa nào đẹp nhất...',
];

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [typingText, setTypingText] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      setActiveCategory(query);
      setCurrentPage(1);
    }
  };

  const handleTagClick = (tag: string) => {
    const category = tag.replace(/^[^\s]+\s/, '');
    setSearchQuery(category);
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Typing effect
  useEffect(() => {
    if (isFocused || searchQuery) return;

    const currentSuggestion = searchSuggestions[suggestionIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (typingText.length < currentSuggestion.length) {
        timeout = setTimeout(() => {
          setTypingText(currentSuggestion.slice(0, typingText.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => setIsTyping(false), 2000);
      }
    } else {
      if (typingText.length > 0) {
        timeout = setTimeout(() => {
          setTypingText(typingText.slice(0, -1));
        }, 50);
      } else {
        setSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [typingText, isTyping, suggestionIndex, isFocused, searchQuery]);

  useEffect(() => {
    const handleFilter = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveCategory(customEvent.detail);
      setCurrentPage(1); // Reset page on new search/filter
    };
    window.addEventListener('filterHomeDestinations', handleFilter);
    return () => window.removeEventListener('filterHomeDestinations', handleFilter);
  }, []);

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        // Map category name từ tiếng Việt sang id cho API
        const categoryMap: { [key: string]: string } = {
          'Biển': 'beach',
          'Núi': 'mountain',
          'Chùa & Đền': 'temple',
          'Khách sạn': 'hotel',
          'Nhà hàng': 'restaurant',
          'Quán Cafe': 'cafe',
          'Di tích': 'historical',
          'Thành phố': 'city',
          'Ẩm thực': 'restaurant',
          'Nông thôn': 'countryside',
        };
        const mappedCategoryId = categoryMap[activeCategory];

        // Build the URL depending on whether a category is selected
        let url = `${process.env.NEXT_PUBLIC_API_URL}/destinations?limit=6&page=${currentPage}`;
        if (mappedCategoryId) {
          url += `&category=${encodeURIComponent(mappedCategoryId)}&isIconic=true`;
        } else if (activeCategory) {
          url += `&search=${encodeURIComponent(activeCategory)}`;
        } else {
          // Mặc định chỉ hiện địa điểm du lịch nổi tiếng (isIconic), không hiện nhà hàng/khách sạn/dịch vụ
          url += `&isIconic=true&excludeCategories=restaurant,hotel,cafe`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setDestinations(data.data);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching destinations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, [activeCategory, currentPage]);

  return (
    <section id="home-destinations" className="pt-12 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              Điểm Đến Hấp Dẫn
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Khám Phá <span className="gradient-text">{activeCategory || 'Việt Nam'}</span>
            </h2>
          </div>
          <Link 
            href="/destinations"
            className="mt-6 md:mt-0 px-6 py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-700 hover:border-sky-500 hover:text-sky-500 transition-all"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-14 pr-4 py-4 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-lg"
                />
                {/* Typing placeholder overlay */}
                {!searchQuery && !isFocused && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-gray-500 text-lg">
                      {typingText}
                      <span className="inline-block w-0.5 h-5 bg-sky-500 ml-0.5 animate-pulse"></span>
                    </span>
                  </div>
                )}
                {isFocused && !searchQuery && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-gray-400 text-lg">Bạn muốn đi đâu?</span>
                  </div>
                )}
              </div>
              <button 
                onClick={handleSearch}
                className="px-8 py-4 bg-gradient-to-r from-sky-500 via-violet-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all hover:scale-105 shimmer"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Khám Phá
                </span>
              </button>
            </div>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {['🏖️ Biển', '🏔️ Núi', '⛩️ Chùa & Đền', '🏨 Khách sạn', '🍜 Nhà hàng', '☕ Quán Cafe'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md border ${
                  activeCategory === tag.replace(/^[^\s]+\s/, '')
                    ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                    : 'bg-gray-50 hover:bg-white text-gray-700 border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {activeCategory && (
              <button 
                onClick={() => { setActiveCategory(''); setSearchQuery(''); }}
                className="px-4 py-2 text-sm text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all border border-red-200"
              >
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-200 rounded-3xl h-96"></div>
              ))}
            </div>
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy kết quả nào</h3>
            <p className="text-gray-500 mb-6">Chúng tôi không tìm thấy điểm đến nào phù hợp với tìm kiếm của bạn.</p>
            <button 
              onClick={() => { setActiveCategory(''); setSearchQuery(''); }}
              className="px-6 py-3 bg-sky-500 text-white rounded-full font-medium hover:bg-sky-600 transition-all"
            >
              Xóa bộ lọc và thử lại
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
            <Link
              key={dest._id}
              href={`/destinations/${dest._id}`}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 card-hover cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={dest.images[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-800">
                  {categoryTags[dest.category] || dest.category}
                </span>

                <button
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-2xl font-bold">{priceLabels[dest.priceRange] || 'Liên hệ'}</span>
                  <span className="text-white/80 text-sm">/người</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-sky-600 transition-colors">
                  {dest.name}
                </h3>
                <p className="text-gray-500 text-sm mb-2">{dest.location.city}</p>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold text-gray-900">{dest.rating}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    {dest.reviewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đánh giá
                  </span>
                </div>
              </div>
            </Link>
          ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && destinations.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-sky-50 text-gray-500 disabled:opacity-50 transition-all"
            >
              ←
            </button>
            
            {/* Limit page buttons to avoid overflow if many pages */}
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              // Simple logic to show pages around current page
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - 4 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-full font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'border border-gray-200 text-gray-600 hover:bg-sky-50 hover:text-sky-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="flex items-end pb-2 text-gray-400">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-10 h-10 rounded-full font-medium transition-all border border-gray-200 text-gray-600 hover:bg-sky-50 hover:text-sky-600"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-sky-50 text-gray-500 disabled:opacity-50 transition-all"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

