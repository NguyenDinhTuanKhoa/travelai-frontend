import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cho phép load ảnh từ các nguồn uy tín
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Wildcard - cho phép tất cả HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // Wildcard - cho phép tất cả HTTP (chỉ dùng cho dev)
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    unoptimized: true, // Bypass Next.js Image Optimization để tránh timeout/403 từ external sources
  },
  
  // Thêm turbopack config rỗng để tắt warning
  turbopack: {},
};

export default nextConfig;
