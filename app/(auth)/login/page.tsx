'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleResponse = async (response: any) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Đăng nhập Google thất bại');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập bằng Google');
    } finally {
      setLoading(false);
    }
  };

  const initGoogleSignIn = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('googleBtn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '320',
            text: 'signin_with',
            shape: 'rectangular'
          }
        );
      } catch (err) {
        console.error('Error initializing Google Sign-In:', err);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      initGoogleSignIn();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Đăng nhập thất bại');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-b from-sky-300 via-sky-50 to-white">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={initGoogleSignIn} 
      />
      
      {/* Soft background glow blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-sky-400/15 to-transparent rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-400/15 to-transparent rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4"></div>
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

      {/* Sun Decoration */}
      <div className="absolute top-6 right-6 md:top-12 md:right-12 pointer-events-none select-none z-0">
        <div className="relative flex items-center justify-center">
          {/* Glow effect */}
          <div className="absolute w-24 h-24 bg-amber-400/20 rounded-full blur-xl animate-pulse"></div>
          {/* Sun body & rays */}
          <svg className="w-16 h-16 text-amber-500 rotate-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" fill="currentColor" className="text-amber-400" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Floating Clouds */}
      <div className="absolute top-[15%] left-0 pointer-events-none select-none z-0 animate-cloud-1 opacity-70">
        <svg className="w-28 h-14 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      </div>

      <div className="absolute top-[45%] left-0 pointer-events-none select-none z-0 animate-cloud-2 opacity-50">
        <svg className="w-36 h-18 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      </div>

      <div className="absolute bottom-[20%] left-0 pointer-events-none select-none z-0 animate-cloud-3 opacity-80">
        <svg className="w-20 h-10 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      </div>

      {/* Floating Airplane */}
      <div className="absolute top-[8%] left-0 pointer-events-none select-none z-0 animate-plane opacity-75">
        <svg className="w-10 h-10 text-white/90 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" />
        </svg>
      </div>

      {/* Cloud & Plane Drift Keyframes */}
      <style>{`
        @keyframes cloudDrift {
          0% { transform: translateX(-200px); }
          100% { transform: translateX(100vw); }
        }
        @keyframes planeDrift {
          0% { transform: translateX(-100px) translateY(0) rotate(85deg); }
          100% { transform: translateX(100vw) translateY(-40px) rotate(85deg); }
        }
        .animate-cloud-1 {
          animation: cloudDrift 35s linear infinite;
        }
        .animate-cloud-2 {
          animation: cloudDrift 55s linear infinite;
          animation-delay: -15s;
        }
        .animate-cloud-3 {
          animation: cloudDrift 45s linear infinite;
          animation-delay: -30s;
        }
        .animate-plane {
          animation: planeDrift 22s linear infinite;
          animation-delay: 3s;
        }
      `}</style>

      <div className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border-2 border-sky-500/30 shadow-2xl shadow-slate-100/40 transition-all hover:shadow-slate-200/50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 group inline-flex">
          <Image src="/logonew.png" alt="Logo" width={40} height={40} className="rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Travel<span className="gradient-text">AI</span>
          </span>
        </Link>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Chào mừng trở lại!</h1>
        <p className="text-slate-500 mb-8 text-sm">Đăng nhập để tiếp tục hành trình của bạn</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200/60 rounded-xl text-red-600 text-sm flex items-start gap-2 animate-fadeIn">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-sky-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-sky-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500/20 focus:ring-2 accent-sky-500" />
              <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
            <Link href="/forgot-password" className="text-sm font-semibold text-sky-500 hover:text-sky-600 transition-colors">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang đăng nhập...
              </span>
            ) : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/70 backdrop-blur-md text-slate-400">Hoặc đăng nhập với</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div id="googleBtn" className="w-full flex justify-center">
              {/* Google Sign-In button will be rendered here by GIS script */}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-500 text-sm">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-sky-500 font-semibold hover:text-sky-600 transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
