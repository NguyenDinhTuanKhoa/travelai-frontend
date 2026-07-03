'use client';
import { useState, useEffect } from 'react';
import { friendApi } from '../../lib/api';

interface FriendItem {
  _id: string;
  friendshipId: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string }) => Promise<void>;
  forceGroup?: boolean;
}

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) return <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function NewConversationModal({ open, onClose, onSubmit, forceGroup = false }: Props) {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setGroupName('');
    setLoading(true);
    friendApi.list().then(res => {
      if (res.data) setFriends(((res.data as { data: FriendItem[] }).data) || []);
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isGroupMode = forceGroup || selected.size >= 2;
  const minRequired = forceGroup ? 2 : 1;
  const MAX_GROUP = 100;
  // Tối đa 99 bạn (cộng cả mình = 100)
  const overLimit = isGroupMode && selected.size > MAX_GROUP - 1;
  const canSubmit = selected.size >= minRequired && !submitting && !overLimit;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const ids = Array.from(selected);
    await onSubmit({
      type: isGroupMode ? 'group' : 'direct',
      participantIds: ids,
      name: isGroupMode ? (groupName.trim() || `Nhóm ${ids.length + 1} người`) : undefined,
    });
    setSubmitting(false);
  };

  const title = forceGroup ? '👥 Tạo nhóm mới' : '💬 Tin nhắn mới';
  const submitLabel = forceGroup ? 'Tạo nhóm' : (isGroupMode ? 'Tạo nhóm' : 'Bắt đầu chat');
  const hint = forceGroup
    ? `Chọn 2 – ${MAX_GROUP - 1} bạn để tạo nhóm (tối đa ${MAX_GROUP} thành viên)`
    : 'Chọn 1 người để chat riêng hoặc nhiều người để tạo nhóm';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {isGroupMode && (
          <div className="p-4 border-b border-gray-100">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên nhóm</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder={`Nhóm ${Math.max(selected.size + 1, 3)} người`}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center py-8 text-gray-400 text-sm">Đang tải...</p>
          ) : friends.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Bạn chưa có bạn nào. Kết bạn trước nhé!</p>
          ) : (
            friends.map(f => (
              <label key={f._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(f._id)}
                  onChange={() => toggle(f._id)}
                  className="w-4 h-4 accent-sky-500"
                />
                <Avatar name={f.name} avatar={f.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.name}</p>
                  <p className="text-xs text-gray-500 truncate">{f.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Đã chọn {selected.size}{isGroupMode ? ` / ${MAX_GROUP - 1}` : ''}
            {forceGroup && selected.size < 2 && (
              <span className="text-orange-500 ml-1">• cần ≥ 2</span>
            )}
            {overLimit && (
              <span className="text-red-500 ml-1">• vượt giới hạn {MAX_GROUP} thành viên</span>
            )}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-5 py-2 text-white font-semibold rounded-xl disabled:opacity-50 ${
              forceGroup
                ? 'bg-gradient-to-r from-orange-500 to-pink-500'
                : 'bg-gradient-to-r from-sky-500 to-violet-500'
            }`}
          >
            {submitting ? 'Đang tạo...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
