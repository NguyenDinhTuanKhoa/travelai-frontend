'use client';
import { useState, useEffect } from 'react';

const destinations = ['Đà Nẵng', 'Phú Quốc', 'Hội An', 'Sapa', 'Nha Trang', 'Đà Lạt'];

export default function Hero() {
  const [currentDest, setCurrentDest] = useState(0);

  // Destination rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDest((prev) => (prev + 1) % destinations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-8">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-sky-50"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920')] bg-cover bg-center opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl float float-delay-1"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl float float-delay-2"></div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center flex-1 flex flex-col justify-center w-full mt-10">
        <div className="slide-up">
          <span className="inline-block px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full text-sky-700 text-sm font-bold mb-6 border border-sky-200 shadow-sm">
            ✨ Khám phá với sức mạnh AI
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 slide-up" style={{ animationDelay: '0.1s' }}>
          Hành Trình Của Bạn
          <br />
          <span className="gradient-text">Bắt Đầu Từ Đây</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-700 font-medium mb-4 slide-up" style={{ animationDelay: '0.2s' }}>
          Để AI giúp bạn khám phá
        </p>

        {/* Animated Destination */}
        <div className="h-12 mb-8 slide-up" style={{ animationDelay: '0.3s' }}>
          <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-violet-400 to-orange-400 transition-all duration-500">
            {destinations[currentDest]}
          </span>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="relative z-10 mt-12 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-sky-400 flex items-start justify-center p-2 bg-white/50 backdrop-blur-sm shadow-sm">
          <div className="w-1.5 h-3 bg-sky-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
