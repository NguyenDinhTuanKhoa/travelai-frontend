'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    preferences: {
      travelStyle: [] as string[],
      budget: '',
      interests: [] as string[]
    }
  });
  const [stats, setStats] = useState({ saved: 0, itineraries: 0, reviews: 0 });

  const travelStyles = ['Phiêu lưu', 'Thư giãn', 'Văn hóa', 'Ẩm thực', 'Thiên nhiên', 'Lịch sử'];
  const budgetOptions = [
    { value: 'low', label: '💰 Tiết kiệm' },
    { value: 'medium', label: '💵 Trung bình' },
    { value: 'high', label: '💎 Cao cấp' }
  ];
  const interestOptions = ['Biển', 'Núi', 'Thành phố', 'Nông thôn', 'Di tích', 'Ẩm thực', 'Mua sắm', 'Chụp ảnh'];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
    loadStats();
  }, [user, authLoading, router]);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const loadProfile = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      const data = await res.json();
      if (data.success || data._id) {
        const userData = data.data || data;
        setFormData({
          name: userData.name || '',
          preferences: userData.preferences || { travelStyle: [], budget: '', interests: [] }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;

    try {
      const [savedRes, itinRes, reviewsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/saved`, { headers: { Authorization: `Bearer ${savedToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries`, { headers: { Authorization: `Bearer ${savedToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/my`, { headers: { Authorization: `Bearer ${savedToken}` } })
      ]);
      const savedData = await savedRes.json();
      const itinData = await itinRes.json();
      const reviewsData = await reviewsRes.json();
      
      setStats({
        saved: savedData.data?.length || 0,
        itineraries: itinData.data?.length || 0,
        reviews: reviewsData.data?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const savedToken = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        updateUser({
          name: formData.name,
          preferences: formData.preferences
        });
        setEditing(false);
      } else {
        setMessage({ type: 'error', text: data.message || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể cập nhật profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file hình ảnh hợp lệ.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 250;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Crop square from center
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;

          ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDim, maxDim);
          const base64Data = canvas.toDataURL('image/jpeg', 0.85);

          const savedToken = localStorage.getItem('token');
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${savedToken}`
              },
              body: JSON.stringify({
                avatar: base64Data
              })
            });
            const data = await res.json();
            if (data.success) {
              updateUser({ avatar: base64Data });
              setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
            } else {
              setMessage({ type: 'error', text: data.message || 'Lỗi cập nhật ảnh đại diện.' });
            }
          } catch (error) {
            setMessage({ type: 'error', text: 'Không thể cập nhật ảnh đại diện' });
          } finally {
            setLoading(false);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleTravelStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        travelStyle: prev.preferences.travelStyle.includes(style)
          ? prev.preferences.travelStyle.filter(s => s !== style)
          : [...prev.preferences.travelStyle, style]
      }
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests.includes(interest)
          ? prev.preferences.interests.filter(i => i !== interest)
          : [...prev.preferences.interests, interest]
      }
    }));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/30 relative overflow-hidden">
      <Navbar />

      {/* Decorative blurred backgrounds for a premium ambient glow */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: User Summary & Navigation */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-3xl p-6 text-center transition hover:shadow-2xl duration-300">
              
              {/* Profile Image with Camera Hover */}
              <div 
                onClick={triggerFileInput}
                className="relative w-32 h-32 mx-auto mb-5 group cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-md relative bg-gray-100 flex items-center justify-center transition group-hover:ring-sky-200">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-5xl font-extrabold select-none">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  
                  {/* Camera overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                    <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Floating Pencil Button */}
                <div className="absolute bottom-1 right-1 bg-gradient-to-r from-sky-500 to-indigo-500 hover:scale-105 active:scale-95 text-white p-2.5 rounded-full shadow-lg border-2 border-white transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>

              {/* User Bio */}
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{formData.name || user.name}</h2>
              <p className="text-gray-400 text-sm mb-4 font-medium">{user.email}</p>
              
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === 'admin' 
                  ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                  : 'bg-sky-50 text-sky-600 border border-sky-100'
              }`}>
                {user.role === 'admin' ? '👑 Quản trị viên' : '✈️ Lữ khách'}
              </span>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2 py-5 my-6 border-y border-gray-100">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-sky-500">{stats.saved}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đã lưu</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-indigo-500">{stats.itineraries}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lịch trình</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-amber-500">{stats.reviews}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đánh giá</span>
                </div>
              </div>

              {/* Desktop Sidebar Navigation */}
              <div className="space-y-1.5 text-left hidden lg:block">
                {[
                  { id: 'info', label: 'Thông tin cá nhân', emoji: '👤' },
                  { id: 'preferences', label: 'Sở thích du lịch', emoji: '✈️' },
                  { id: 'quicklinks', label: 'Truy cập nhanh', emoji: '🧭' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 translate-x-1'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full mt-6 py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-2xl transition duration-200 font-bold flex items-center justify-center gap-2"
              >
                <span>🚪</span> Đăng xuất
              </button>
            </div>
          </div>

          {/* Right Column: Tab View Contents */}
          <div className="lg:col-span-8">
            
            {/* Mobile Tab Control */}
            <div className="flex gap-2 p-1 bg-gray-100/80 rounded-2xl lg:hidden mb-6">
              {[
                { id: 'info', label: 'Thông tin', emoji: '👤' },
                { id: 'preferences', label: 'Sở thích', emoji: '✈️' },
                { id: 'quicklinks', label: 'Tiện ích', emoji: '🧭' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id 
                      ? 'bg-white text-gray-900 shadow-md' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Notification Messages */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                <p className="font-semibold text-sm">{message.text}</p>
              </div>
            )}

            {/* Tab: Personal Information */}
            {activeTab === 'info' && (
              <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-3xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">Thông tin cá nhân</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Quản lý các thông tin cá bản về tài khoản</p>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sky-500 hover:bg-sky-50 rounded-xl transition font-semibold border border-sky-100 hover:border-sky-300"
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          loadProfile();
                        }}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl transition border border-gray-200 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:shadow-lg hover:shadow-sky-500/20 text-white rounded-xl transition font-bold disabled:opacity-50"
                      >
                        {loading ? 'Đang lưu...' : 'Lưu lại'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Họ và tên</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition duration-200 font-medium"
                        placeholder="Nhập đầy đủ tên của bạn"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                        <p className="text-gray-900 font-semibold">{formData.name || 'Chưa cập nhật'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Địa chỉ Email</label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                      <p className="text-gray-600 font-semibold">{user.email}</p>
                      <span className="text-[10px] bg-gray-200/50 text-gray-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider select-none">Bảo mật</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vai trò tài khoản</label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                      <span className="text-lg">{user.role === 'admin' ? '👑' : '✈️'}</span>
                      <p className="text-gray-600 font-semibold">
                        {user.role === 'admin' ? 'Quản trị viên (Toàn quyền hệ thống)' : 'Thành viên (Tìm kiếm và tạo lịch trình)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Travel Preferences */}
            {activeTab === 'preferences' && (
              <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-3xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">Sở thích du lịch</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Tùy biến để nhận gợi ý hành trình cá nhân hóa</p>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sky-500 hover:bg-sky-50 rounded-xl transition font-semibold border border-sky-100 hover:border-sky-300"
                    >
                      ✏️ Tùy chỉnh
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          loadProfile();
                        }}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl transition border border-gray-200 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:shadow-lg hover:shadow-sky-500/20 text-white rounded-xl transition font-bold disabled:opacity-50"
                      >
                        {loading ? 'Đang lưu...' : 'Lưu lại'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Style Option */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Phong cách du lịch</label>
                    <div className="flex flex-wrap gap-2.5">
                      {travelStyles.map(style => {
                        const selected = formData.preferences.travelStyle.includes(style);
                        return (
                          <button
                            key={style}
                            onClick={() => editing && toggleTravelStyle(style)}
                            disabled={!editing}
                            className={`px-4.5 py-2.5 rounded-full text-sm font-bold transition duration-200 flex items-center gap-1.5 ${
                              selected
                                ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/10 scale-[1.02]'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100'
                            } ${!editing ? 'cursor-default opacity-85' : 'hover:scale-[1.02] active:scale-95'}`}
                          >
                            <span>{selected ? '✦' : '○'}</span>
                            <span>{style}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mức ngân sách</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {budgetOptions.map(option => {
                        const selected = formData.preferences.budget === option.value;
                        const labelParts = option.label.split(' ');
                        const emoji = labelParts[0];
                        const text = labelParts[1];
                        return (
                          <button
                            key={option.value}
                            onClick={() => editing && setFormData(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, budget: option.value }
                            }))}
                            disabled={!editing}
                            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border text-center transition-all ${
                              selected
                                ? 'border-indigo-500 bg-gradient-to-tr from-indigo-50/70 to-sky-50/40 text-indigo-700 font-extrabold ring-2 ring-indigo-500/15 scale-105 shadow-md shadow-indigo-500/5'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                            } ${!editing ? 'cursor-default opacity-85' : 'active:scale-95'}`}
                          >
                            <span className="text-3xl filter drop-shadow-sm">{emoji}</span>
                            <span className="text-sm font-bold">{text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interests Option */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sở thích cá nhân</label>
                    <div className="flex flex-wrap gap-2.5">
                      {interestOptions.map(interest => {
                        const selected = formData.preferences.interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            onClick={() => editing && toggleInterest(interest)}
                            disabled={!editing}
                            className={`px-4.5 py-2.5 rounded-full text-sm font-bold transition duration-200 flex items-center gap-1.5 ${
                              selected
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/10 scale-[1.02]'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100'
                            } ${!editing ? 'cursor-default opacity-85' : 'hover:scale-[1.02] active:scale-95'}`}
                          >
                            <span>{selected ? '★' : '☆'}</span>
                            <span>{interest}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Quick Links */}
            {activeTab === 'quicklinks' && (
              <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-3xl p-6 md:p-8">
                <div className="mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-xl font-extrabold text-gray-900">Truy cập nhanh</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Lối tắt đến các chức năng thông minh của TravelAI</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: 'Địa điểm đã lưu',
                      desc: 'Các danh lam thắng cảnh bạn đã yêu thích',
                      emoji: '❤️',
                      path: '/saved',
                      hoverBg: 'hover:bg-rose-50/30 hover:border-rose-200'
                    },
                    {
                      label: 'Trợ lý AI Chat',
                      desc: 'Lên kế hoạch du lịch thông minh cùng Bot',
                      emoji: '🤖',
                      path: '/ai-chat',
                      hoverBg: 'hover:bg-indigo-50/30 hover:border-indigo-200'
                    },
                    {
                      label: 'Bản đồ du lịch',
                      desc: 'Trải nghiệm tìm kiếm trực quan bằng vệ tinh',
                      emoji: '🗺️',
                      path: '/explore',
                      hoverBg: 'hover:bg-sky-50/30 hover:border-sky-200'
                    },
                    {
                      label: 'Danh sách điểm đến',
                      desc: 'Khám phá văn hóa ẩm thực các vùng miền',
                      emoji: '📍',
                      path: '/destinations',
                      hoverBg: 'hover:bg-amber-50/30 hover:border-amber-200'
                    }
                  ].map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => router.push(link.path)}
                      className={`flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl text-left transition duration-300 hover:shadow-lg ${link.hoverBg}`}
                    >
                      <div className="text-3xl p-3 bg-gray-50 rounded-xl shadow-inner select-none">{link.emoji}</div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-base">{link.label}</h4>
                        <p className="text-gray-400 text-xs mt-1 font-semibold leading-relaxed">{link.desc}</p>
                      </div>
                    </button>
                  ))}

                  {user.role === 'admin' && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="flex items-start gap-4 p-5 bg-purple-50/30 border border-purple-100 rounded-2xl text-left transition duration-300 hover:shadow-lg hover:bg-purple-50 hover:border-purple-300 col-span-1 sm:col-span-2"
                    >
                      <div className="text-3xl p-3 bg-purple-100/60 rounded-xl shadow-inner select-none">⚙️</div>
                      <div>
                        <h4 className="font-extrabold text-purple-900 text-base">Quản trị hệ thống</h4>
                        <p className="text-purple-600/80 text-xs mt-1 font-semibold leading-relaxed">
                          Bảng điều khiển quản lý địa điểm, người dùng, bài viết đánh giá và hoạt động hệ thống.
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

