'use client';
import { useState } from 'react';

// ── Schema khớp với backend buildClarificationBlock() ─────────────────────────
export interface ClarifyOption {
  value: string;
  label: string;
  icon?: string;
}
export interface ClarifyField {
  key: string;
  label: string;
  type: 'region' | 'select' | 'multiselect' | 'text';
  options?: ClarifyOption[];
  required?: boolean;
  allowCustom?: boolean;
  placeholder?: string;
}
export interface ClarifyFormData {
  type: string;
  title?: string;
  fields: ClarifyField[];
  // Giá trị tích sẵn theo loại hình (vd đi biển → interests:['biển']; trăng mật → people:'2 người').
  // Key = field.key. Single field nhận string, multiselect nhận string[].
  defaults?: Record<string, string | string[]>;
}

interface Props {
  data: ClarifyFormData;
  disabled?: boolean;
  onSubmit: (composed: string) => void;
}

export default function ClarifyForm({ data, disabled = false, onSubmit }: Props) {
  // Giá trị chip đã chọn (single) hoặc mảng (multiselect). Khởi tạo từ data.defaults để
  // các chip do backend tích sẵn theo loại hình hiện ngay trạng thái đã chọn.
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    () => ({ ...(data.defaults || {}) })
  );
  // Giá trị ô tự nhập cho field allowCustom
  const [customText, setCustomText] = useState<Record<string, string>>({});

  // Giá trị cuối của field single (ưu tiên ô tự nhập)
  const single = (key: string): string =>
    (customText[key]?.trim() || (answers[key] as string) || '').trim();
  const multi = (key: string): string[] =>
    Array.isArray(answers[key]) ? (answers[key] as string[]) : [];

  const pickChip = (key: string, value: string) => {
    if (disabled) return;
    setAnswers(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    setCustomText(prev => ({ ...prev, [key]: '' })); // chọn chip → xóa custom
  };
  const typeCustom = (key: string, value: string) => {
    if (disabled) return;
    setCustomText(prev => ({ ...prev, [key]: value }));
    setAnswers(prev => ({ ...prev, [key]: '' })); // gõ custom → bỏ chip
  };
  const toggleMulti = (key: string, value: string) => {
    if (disabled) return;
    setAnswers(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [key]: arr };
    });
  };

  // Ghép câu gửi cho AI. QUAN TRỌNG: luôn có "đi du lịch" + "lịch trình" + địa điểm,
  // và TUYỆT ĐỐI không chứa chữ "tour" (kẻo backend tắt chế độ tạo lịch trình).
  const compose = (): string => {
    const loc = single('location');
    const days = single('days');
    const budget = single('budget');
    const people = single('people');
    const interests = multi('interests');

    const parts = [`Tôi muốn đi du lịch ${loc}`];
    if (days) parts.push(/^\d+$/.test(days) ? `${days} ngày` : days);
    if (budget) parts.push(`ngân sách ${budget}`);
    if (people) parts.push(/^\d+$/.test(people) ? `đi ${people} người` : `đi ${people}`);
    if (interests.length) parts.push(`thích ${interests.join(', ')}`);
    parts.push('hãy gợi ý lịch trình chi tiết cho tôi');
    return parts.join(', ');
  };

  const canSubmit = !disabled && single('location').length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(compose());
  };

  const chipClass = (selected: boolean) =>
    `px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-center ${
      selected
        ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/10 scale-[1.02]'
        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
    } ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`;

  return (
    <div className="mt-3 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
      {data.title && (
        <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
          <span>📝</span> {data.title}
        </p>
      )}

      <div className="space-y-4">
        {data.fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-400"> *</span>}
            </label>

            {field.type === 'multiselect' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {field.options?.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleMulti(field.key, opt.value)}
                    className={chipClass(multi(field.key).includes(opt.value))}
                  >
                    {opt.icon && <span className="mr-1">{opt.icon}</span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {field.options && field.options.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {field.options.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => pickChip(field.key, opt.value)}
                        className={chipClass(
                          (answers[field.key] as string) === opt.value && !customText[field.key]
                        )}
                      >
                        {opt.icon && <span className="mr-1">{opt.icon}</span>}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                {(field.allowCustom || field.type === 'text') && (
                  <input
                    type="text"
                    value={customText[field.key] || ''}
                    onChange={e => typeCustom(field.key, e.target.value)}
                    placeholder={field.placeholder || 'Hoặc tự nhập...'}
                    disabled={disabled}
                    className="mt-2.5 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {disabled ? (
        <p className="mt-4 text-sm text-emerald-600 font-medium flex items-center gap-1.5">
          <span>✅</span> Đã gửi yêu cầu
        </p>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-4 w-full py-3 bg-gradient-to-r from-sky-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gợi ý lịch trình →
        </button>
      )}
    </div>
  );
}
