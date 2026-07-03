'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface QuizAnswer {
  travelStyle: string[];
  budget: string;
  interests: string[];
  duration: string;
  companion: string;
}

const questions = [
  {
    id: 'travelStyle',
    question: 'Bạn thích phong cách du lịch nào?',
    subtitle: 'Chọn một hoặc nhiều',
    type: 'multiple',
    options: [
      { value: 'Phiêu lưu', icon: '🏃', label: 'Phiêu lưu', desc: 'Khám phá, mạo hiểm' },
      { value: 'Thư giãn', icon: '🧘', label: 'Thư giãn', desc: 'Nghỉ dưỡng, spa' },
      { value: 'Văn hóa', icon: '🏛️', label: 'Văn hóa', desc: 'Lịch sử, di sản' },
      { value: 'Ẩm thực', icon: '🍜', label: 'Ẩm thực', desc: 'Khám phá món ngon' },
      { value: 'Thiên nhiên', icon: '🌿', label: 'Thiên nhiên', desc: 'Cảnh đẹp, sinh thái' },
      { value: 'Lịch sử', icon: '📜', label: 'Lịch sử', desc: 'Di tích, bảo tàng' },
    ]
  },
  {
    id: 'budget',
    question: 'Ngân sách của bạn như thế nào?',
    subtitle: 'Chọn một mức phù hợp',
    type: 'single',
    options: [
      { value: 'low', icon: '💰', label: 'Tiết kiệm', desc: 'Dưới 2 triệu/người' },
      { value: 'medium', icon: '💵', label: 'Trung bình', desc: '2-5 triệu/người' },
      { value: 'high', icon: '💎', label: 'Cao cấp', desc: 'Trên 5 triệu/người' },
    ]
  },
  {
    id: 'interests',
    question: 'Bạn muốn đến đâu?',
    subtitle: 'Chọn một hoặc nhiều địa hình',
    type: 'multiple',
    options: [
      { value: 'Biển', icon: '🏖️', label: 'Biển', desc: 'Bãi biển, đảo' },
      { value: 'Núi', icon: '🏔️', label: 'Núi', desc: 'Leo núi, trekking' },
      { value: 'Thành phố', icon: '🌆', label: 'Thành phố', desc: 'Đô thị, mua sắm' },
      { value: 'Nông thôn', icon: '🌾', label: 'Nông thôn', desc: 'Làng quê, yên bình' },
      { value: 'Di tích', icon: '🏛️', label: 'Di tích', desc: 'Lịch sử, văn hóa' },
      { value: 'Ẩm thực', icon: '🍜', label: 'Ẩm thực', desc: 'Phố ăn uống' },
    ]
  },
  {
    id: 'duration',
    question: 'Bạn dự định đi bao lâu?',
    subtitle: 'Chọn thời gian phù hợp',
    type: 'single',
    options: [
      { value: 'weekend', icon: '📅', label: '1-2 ngày', desc: 'Cuối tuần' },
      { value: 'short', icon: '🗓️', label: '3-5 ngày', desc: 'Nghỉ ngắn ngày' },
      { value: 'long', icon: '📆', label: '6+ ngày', desc: 'Nghỉ dài ngày' },
    ]
  },
  {
    id: 'companion',
    question: 'Bạn đi cùng ai?',
    subtitle: 'Chọn hình thức phù hợp',
    type: 'single',
    options: [
      { value: 'solo', icon: '🧑', label: 'Một mình', desc: 'Du lịch solo' },
      { value: 'couple', icon: '💑', label: 'Cặp đôi', desc: 'Lãng mạn' },
      { value: 'family', icon: '👨‍👩‍👧‍👦', label: 'Gia đình', desc: 'Có trẻ em' },
      { value: 'friends', icon: '👥', label: 'Bạn bè', desc: 'Nhóm bạn' },
    ]
  }
];

// ─── Mini Login/Register Modal ────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let result;
    if (tab === 'login') {
      result = await login(email, password);
    } else {
      if (!name.trim()) { setError('Vui lòng nhập họ tên'); setLoading(false); return; }
      result = await register(name, email, password);
    }
    setLoading(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeInScale_0.2s_ease]">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-sky-500 via-violet-500 to-purple-600 px-8 py-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all"
          >
            ✕
          </button>
          <div className="text-4xl mb-2">🤖</div>
          <h2 className="text-2xl font-black text-white">Gần xong rồi!</h2>
          <p className="text-white/80 text-sm mt-1">Đăng nhập để nhận gợi ý từ AI ngay</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${tab === 'login' ? 'text-violet-600 border-b-2 border-violet-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${tab === 'register' ? 'text-violet-600 border-b-2 border-violet-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-violet-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <><span className="animate-spin">⏳</span> Đang xử lý...</>
            ) : tab === 'login' ? (
              <><span>🚀</span> Đăng nhập & nhận gợi ý</>
            ) : (
              <><span>✨</span> Tạo tài khoản & nhận gợi ý</>
            )}
          </button>

          {tab === 'login' && (
            <p className="text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <button type="button" onClick={() => setTab('register')} className="text-violet-600 font-semibold hover:underline">
                Đăng ký miễn phí
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Main SmartSuggestion Component ──────────────────────────────────────────
export default function SmartSuggestion({ asTab = false }: { asTab?: boolean }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({
    travelStyle: [],
    budget: '',
    interests: [],
    duration: '',
    companion: ''
  });
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const currentQuestion = questions[currentStep];

  const handleSelect = (value: string) => {
    const questionId = currentQuestion.id as keyof QuizAnswer;
    if (currentQuestion.type === 'multiple') {
      const currentValues = answers[questionId] as string[];
      if (currentValues.includes(value)) {
        setAnswers({ ...answers, [questionId]: currentValues.filter(v => v !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...currentValues, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const isSelected = (value: string) => {
    const questionId = currentQuestion.id as keyof QuizAnswer;
    const answer = answers[questionId];
    if (Array.isArray(answer)) return answer.includes(value);
    return answer === value;
  };

  const canProceed = () => {
    const questionId = currentQuestion.id as keyof QuizAnswer;
    const answer = answers[questionId];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== '';
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Build prompt từ answers
  const buildPrompt = () => {
    return `Tôi muốn đi du lịch với phong cách ${answers.travelStyle.join(', ')}, ngân sách ${
      answers.budget === 'low' ? 'tiết kiệm' : answers.budget === 'medium' ? 'trung bình' : 'cao cấp'
    }, thích ${answers.interests.join(', ')}, thời gian ${
      answers.duration === 'weekend' ? '1-2 ngày' : answers.duration === 'short' ? '3-5 ngày' : '6+ ngày'
    }, đi ${
      answers.companion === 'solo' ? 'một mình' : answers.companion === 'couple' ? 'cặp đôi' :
      answers.companion === 'family' ? 'gia đình' : 'nhóm bạn'
    }. Hãy gợi ý điểm đến và lịch trình cụ thể phù hợp nhất cho tôi!`;
  };

  const handleStartChat = () => {
    const prompt = buildPrompt();
    localStorage.setItem('smartSuggestionPrompt', prompt);

    if (!user) {
      // Chưa đăng nhập → hiện Auth Modal thay vì redirect thẳng
      setShowAuthModal(true);
    } else {
      window.location.href = '/ai-chat';
    }
  };

  // Callback sau khi đăng nhập/đăng ký thành công từ modal
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Prompt đã được lưu vào localStorage trước đó
    window.location.href = '/ai-chat';
  };

  const handleSaveToProfile = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferences: {
            travelStyle: answers.travelStyle,
            budget: answers.budget,
            interests: answers.interests
          }
        })
      });
      if (res.ok) setSaved(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({ travelStyle: [], budget: '', interests: [], duration: '', companion: '' });
    setShowResult(false);
    setSaved(false);
  };

  return (
    <>
      {/* Auth Modal - hiện khi guest bấm "Nhận gợi ý" */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <div className={asTab ? "w-full" : "py-20 bg-gradient-to-b from-white to-sky-50"}>
        <div className={asTab ? "w-full" : "max-w-6xl mx-auto px-4"}>
          {/* Header */}
          {!asTab && (
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-sky-500 to-violet-500 text-white rounded-full text-sm font-medium mb-4">
                ✨ Tính năng mới
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Gợi Ý Thông Minh
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Trả lời vài câu hỏi đơn giản, AI sẽ gợi ý điểm đến hoàn hảo cho bạn!
              </p>
            </div>
          )}

          {!isOpen ? (
            /* Start Button */
            <div className="text-center">
              <button
                onClick={() => setIsOpen(true)}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 via-violet-500 to-orange-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105"
              >
                <span className="text-2xl">🎯</span>
                Bắt đầu khám phá sở thích
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="mt-4 text-gray-500">Chỉ mất 1 phút • 5 câu hỏi đơn giản</p>
            </div>
          ) : (
            /* Quiz Modal */
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
              {!showResult ? (
                <>
                  {/* Progress Bar */}
                  <div className="bg-gray-100 h-2">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question */}
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm text-gray-500">
                        Câu {currentStep + 1}/{questions.length}
                      </span>
                      <button
                        onClick={() => { setIsOpen(false); resetQuiz(); }}
                        className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                      >
                        ✕
                      </button>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentQuestion.question}
                    </h3>
                    <p className="text-gray-500 mb-6">{currentQuestion.subtitle}</p>

                    {/* Options */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSelect(option.value)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected(option.value)
                              ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10 scale-[1.02]'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-2xl block mb-2">{option.icon}</span>
                          <span className="font-medium text-gray-900 block">{option.label}</span>
                          <span className="text-xs text-gray-500">{option.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`px-6 py-3 rounded-xl font-medium transition ${
                          currentStep === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        ← Quay lại
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className={`px-6 py-3 rounded-xl font-medium transition ${
                          canProceed()
                            ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/30'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {currentStep === questions.length - 1 ? 'Xem kết quả' : 'Tiếp theo →'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Result */
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Tuyệt vời! Đã xong rồi!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Dựa trên sở thích của bạn, AI sẽ gợi ý những điểm đến phù hợp nhất.
                  </p>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <h4 className="font-medium text-gray-700 mb-3">Sở thích của bạn:</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Phong cách:</span> <span className="font-medium">{answers.travelStyle.join(', ') || 'Chưa chọn'}</span></p>
                      <p><span className="text-gray-500">Ngân sách:</span> <span className="font-medium">{answers.budget === 'low' ? 'Tiết kiệm' : answers.budget === 'medium' ? 'Trung bình' : 'Cao cấp'}</span></p>
                      <p><span className="text-gray-500">Địa hình:</span> <span className="font-medium">{answers.interests.join(', ') || 'Chưa chọn'}</span></p>
                      <p><span className="text-gray-500">Thời gian:</span> <span className="font-medium">{answers.duration === 'weekend' ? '1-2 ngày' : answers.duration === 'short' ? '3-5 ngày' : '6+ ngày'}</span></p>
                      <p><span className="text-gray-500">Đi cùng:</span> <span className="font-medium">{answers.companion === 'solo' ? 'Một mình' : answers.companion === 'couple' ? 'Cặp đôi' : answers.companion === 'family' ? 'Gia đình' : 'Nhóm bạn'}</span></p>
                    </div>
                  </div>

                  {/* Save to Profile */}
                  {user && !saved && (
                    <div className="bg-violet-50 rounded-xl p-4 mb-6 border border-violet-100">
                      <p className="text-violet-700 mb-3 text-sm">💡 Lưu sở thích này vào profile để AI gợi ý tốt hơn?</p>
                      <button
                        onClick={handleSaveToProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition disabled:opacity-50 text-sm font-medium"
                      >
                        {saving ? 'Đang lưu...' : '✓ Lưu vào profile'}
                      </button>
                    </div>
                  )}

                  {saved && (
                    <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
                      <p className="text-green-700 text-sm">✅ Đã lưu sở thích vào profile!</p>
                    </div>
                  )}

                  {/* Guest hint - chỉ hiện khi chưa đăng nhập */}
                  {!user && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2 text-left">
                      <span className="text-amber-500 mt-0.5 shrink-0">💡</span>
                      <p className="text-amber-800 text-xs">
                        Đăng nhập để AI lưu lịch sử chat và cá nhân hóa gợi ý dựa trên sở thích của bạn!
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={resetQuiz}
                      className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Làm lại
                    </button>
                    <button
                      onClick={handleStartChat}
                      className="px-6 py-3 bg-gradient-to-r from-sky-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/30 transition flex items-center gap-2 hover:scale-105"
                    >
                      <span>🤖</span>
                      {user ? 'Nhận gợi ý từ AI' : 'Nhận gợi ý (cần đăng nhập)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
