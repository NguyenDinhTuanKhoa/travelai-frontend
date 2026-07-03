'use client';

import { usePathname, useRouter } from 'next/navigation';
import Robot3D from './Robot3D';

export default function GlobalRobot() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Ẩn con robot ở các trang chat AI, profile, admin, login và register
  if (
    pathname?.startsWith('/ai-chat') || 
    pathname?.startsWith('/chat') || 
    pathname?.startsWith('/profile') || 
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/explore') ||
    pathname?.startsWith('/navigate')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-2 md:right-6 z-50 pointer-events-none">
      <div 
        className="relative group cursor-pointer pointer-events-auto"
        onClick={() => router.push('/ai-chat')}
      >
        {/* Speech Bubble */}
        <div className="absolute -top-4 right-[80%] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-x-2 pointer-events-none z-30">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-sky-100/50 whitespace-nowrap transform scale-95 group-hover:scale-100 transition-transform">
            <p className="text-sm font-semibold text-slate-800 mb-1">👋 Chào bạn!</p>
            <p className="text-xs text-slate-500">Nhấn vào đây để nhờ <span className="gradient-text font-bold">Trợ lý AI</span> giúp đỡ nhé</p>
            {/* Arrow pointing right */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white/95 border-t border-r border-sky-100/50 rotate-45"></div>
          </div>
        </div>

        {/* 3D Robot */}
        <div className="relative origin-bottom-right transform scale-75 md:scale-90 hover:scale-[0.8] md:hover:scale-100 transition-transform duration-300">
          <Robot3D />
        </div>
      </div>
    </div>
  );
}
