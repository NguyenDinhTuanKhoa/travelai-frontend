import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white to-slate-50 border-t border-slate-100 relative overflow-visible mt-20">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {/* Brand & Contact */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <Image
                  src="/logonew.png"
                  alt="TravelAI Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">
                Travel<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-violet-500">AI</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Ứng dụng Trí tuệ Nhân tạo trong việc lập kế hoạch và tối ưu hóa trải nghiệm du lịch của bạn.
            </p>

            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100/50">
              <p className="text-slate-800 text-sm font-bold mb-1">
                Khóa luận tốt nghiệp Đại học
              </p>
              <p className="text-slate-600 text-xs">
                Sinh viên thực hiện: <span className="font-semibold text-sky-700">Nguyễn Đinh Tuấn Khoa</span>
              </p>
            </div>

            {/* Removed contact info rows per user request */}

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { name: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', hover: 'hover:bg-[#1877F2]' },
                { name: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', hover: 'hover:bg-gradient-to-tr hover:from-purple-500 hover:to-pink-500' },
                { name: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', hover: 'hover:bg-[#FF0000]' }
              ].map((social) => (
                <a key={social.name} href="#" className={`w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-white ${social.hover} transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon}/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Tính Năng Nổi Bật */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Tính Năng
            </h4>
            <ul className="space-y-3.5">
              {['Lập kế hoạch thông minh', 'Gợi ý lịch trình AI', 'Khám phá điểm đến', 'Tối ưu hóa ngân sách', 'Trợ lý ảo 24/7'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-slate-500 text-sm hover:text-sky-600 transition-all duration-200 inline-flex items-center group">
                    <span className="w-0 overflow-hidden group-hover:w-4 transition-all duration-300 text-sky-500">
                      &rarr;
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ Trợ */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500"></span>
              Hỗ Trợ
            </h4>
            <ul className="space-y-3.5">
              {['Hướng dẫn sử dụng', 'Câu hỏi thường gặp (FAQ)', 'Chính sách bảo mật', 'Điều khoản dịch vụ', 'Báo cáo lỗi'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-slate-500 text-sm hover:text-violet-600 transition-all duration-200 inline-flex items-center group">
                    <span className="w-0 overflow-hidden group-hover:w-4 transition-all duration-300 text-violet-500">
                      &rarr;
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
              Nhận Thông Báo
            </h4>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
              Đăng ký để nhận những gợi ý du lịch và cập nhật tính năng mới nhất từ TravelAI.
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm"
                />
                <button className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-gradient-to-r from-sky-500 to-violet-500 rounded-lg text-white hover:shadow-lg hover:shadow-sky-500/30 transition-all flex items-center justify-center group">
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Premium Support Badge */}
            <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-1 shadow-lg">
              <div className="relative bg-slate-900/50 backdrop-blur-md rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">1900 xxxx</p>
                  <p className="text-sky-300 text-xs font-medium uppercase tracking-wider">Hỗ trợ 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center">
          <p className="text-slate-400 text-xs">
            © 2026 TravelAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
