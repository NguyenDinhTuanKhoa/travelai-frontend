'use client';
import { useState } from 'react';

interface FallbackImageProps {
  images: string[];
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
}

/**
 * Component hiển thị ảnh với fallback tự động
 * Nếu ảnh lỗi, đẩy ảnh đó xuống cuối mảng và hiển thị ảnh tiếp theo
 * Nếu tất cả ảnh đều lỗi, hiển thị icon fallback
 */
export default function FallbackImage({ 
  images, 
  alt, 
  className = '', 
  fallbackIcon = '📍',
  fallbackGradient = 'from-blue-100 to-indigo-100'
}: FallbackImageProps) {
  const [queue, setQueue] = useState<string[]>(() => [...(images || [])]);
  const [allFailed, setAllFailed] = useState(false);

  const handleImageError = () => {
    setQueue(prev => {
      if (prev.length <= 1) {
        setAllFailed(true);
        return prev;
      }
      // Move the broken first image to the end, try next
      const [broken, ...rest] = prev;
      return [...rest, broken];
    });
  };

  if (!queue || queue.length === 0 || allFailed) {
    return (
      <div className={`bg-gradient-to-br ${fallbackGradient} flex items-center justify-center text-3xl ${className}`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <img
      key={queue[0]} // key change forces re-render when src changes
      src={queue[0]}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
}
