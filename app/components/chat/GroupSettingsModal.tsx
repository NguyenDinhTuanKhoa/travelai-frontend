'use client';
import { useState, useEffect, useCallback } from 'react';
import { friendApi, chatApi } from '../../lib/api';

interface Participant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface FriendItem {
  _id: string;
  friendshipId: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CreatorRef {
  _id: string;
  name: string;
  avatar?: string;
}

interface ConversationData {
  _id: string;
  type: 'direct' | 'group';
  name: string;
  participants: Participant[];
  createdBy?: CreatorRef | string;
  createdAt?: string;
}

interface MediaMessage {
  _id: string;
  content: string;
  sender: { _id: string; name: string; avatar?: string };
  createdAt: string;
}

interface SharedItineraryMessage {
  _id: string;
  sender: { _id: string; name: string; avatar?: string };
  createdAt: string;
  itineraryId: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    destinations: Array<{ destination?: { _id: string; name: string; images?: string[] } }>;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  conversation: ConversationData | null;
  currentUserId: string;
  onUpdated: (conv: ConversationData) => void;
  onLeft?: (convId: string) => void;
  onCleared?: (convId: string) => void;
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar?: string; size?: number }) {
  if (avatar) return <img src={avatar} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0"
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

export default function GroupSettingsModal({ open, onClose, conversation, currentUserId, onUpdated, onLeft, onCleared }: Props) {
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [pendingKick, setPendingKick] = useState<Record<string, boolean>>({});
  const [leaving, setLeaving] = useState(false);
  const [media, setMedia] = useState<MediaMessage[]>([]);
  const [itineraries, setItineraries] = useState<SharedItineraryMessage[]>([]);
  const [clearing, setClearing] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<FriendItem[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const loadExtras = useCallback(async (convId: string) => {
    const [m, i] = await Promise.all([
      chatApi.getMedia(convId),
      chatApi.getSharedItineraries(convId),
    ]);
    if (m.data) setMedia(((m.data as { data: MediaMessage[] }).data) || []);
    if (i.data) setItineraries(((i.data as { data: SharedItineraryMessage[] }).data) || []);
  }, []);

  useEffect(() => {
    if (!open || !conversation) return;
    setName(conversation.name || '');
    setShowAddPicker(false);
    setSelectedToAdd(new Set());
    setMedia([]);
    setItineraries([]);
    setPreviewImg(null);
    setUserQuery('');
    setUserResults([]);
    friendApi.list().then(res => {
      if (res.data) setFriends(((res.data as { data: FriendItem[] }).data) || []);
    });
    loadExtras(conversation._id);
  }, [open, conversation, loadExtras]);

  // Debounced user search khi mở picker
  useEffect(() => {
    if (!open || !conversation || !showAddPicker) return;
    setSearchingUsers(true);
    const delay = userQuery.trim().length === 0 ? 0 : 350;
    const t = setTimeout(async () => {
      const res = await chatApi.searchUsersForGroup(conversation._id, userQuery.trim());
      if (res.data) setUserResults(((res.data as { data: FriendItem[] }).data) || []);
      setSearchingUsers(false);
    }, delay);
    return () => clearTimeout(t);
  }, [userQuery, open, conversation, showAddPicker]);

  if (!open || !conversation) return null;

  const participantIds = new Set(conversation.participants.map(p => p._id));
  const addableFriends = friends.filter(f => !participantIds.has(f._id));
  const MAX_GROUP = 100;
  const remainingSlots = Math.max(0, MAX_GROUP - conversation.participants.length);
  const isFull = remainingSlots === 0;
  const creator = typeof conversation.createdBy === 'object' && conversation.createdBy
    ? conversation.createdBy
    : null;

  // Merge danh sách: bạn bè trước, sau đó user search bổ sung (loại trùng)
  const friendIdSet = new Set(addableFriends.map(f => f._id));
  const extraUsers = userResults.filter(u => !friendIdSet.has(u._id));
  const displayUsers = userQuery.trim().length >= 2
    ? userResults
    : [...addableFriends, ...extraUsers];

  const handleRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === conversation.name) return;
    setSavingName(true);
    const res = await chatApi.renameGroup(conversation._id, trimmed);
    setSavingName(false);
    if (res.error) { alert(res.error); return; }
    if (res.data) onUpdated((res.data as { data: ConversationData }).data);
  };

  const handleAdd = async () => {
    if (selectedToAdd.size === 0) return;
    if (selectedToAdd.size > remainingSlots) {
      alert(`Chỉ còn ${remainingSlots} chỗ trong nhóm (tối đa 100 thành viên)`);
      return;
    }
    setAdding(true);
    const res = await chatApi.addMembers(conversation._id, Array.from(selectedToAdd));
    setAdding(false);
    if (res.error) { alert(res.error); return; }
    if (res.data) onUpdated((res.data as { data: ConversationData }).data);
    setSelectedToAdd(new Set());
    setShowAddPicker(false);
  };

  const handleKick = async (userId: string, label: string) => {
    if (!confirm(`Xoá ${label} khỏi nhóm?`)) return;
    setPendingKick(prev => ({ ...prev, [userId]: true }));
    const res = await chatApi.removeMember(conversation._id, userId);
    setPendingKick(prev => ({ ...prev, [userId]: false }));
    if (res.error) { alert(res.error); return; }
    if (res.data) onUpdated((res.data as { data: ConversationData }).data);
  };

  const handleLeave = async () => {
    if (!confirm('Bạn có chắc muốn rời nhóm này?')) return;
    setLeaving(true);
    const res = await chatApi.removeMember(conversation._id, currentUserId);
    setLeaving(false);
    if (res.error) { alert(res.error); return; }
    onLeft?.(conversation._id);
    onClose();
  };

  const handleClearHistory = async () => {
    if (!confirm('Xoá TẤT CẢ tin nhắn trong nhóm này? Mọi thành viên đều sẽ mất lịch sử trò chuyện. Không thể hoàn tác.')) return;
    setClearing(true);
    const res = await chatApi.clearMessages(conversation._id);
    setClearing(false);
    if (res.error) { alert(res.error); return; }
    setMedia([]);
    setItineraries([]);
    onCleared?.(conversation._id);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">⚙️ Cài đặt nhóm</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* THÔNG TIN NHÓM */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-sky-50/60 to-violet-50/40">
            <p className="text-xs font-semibold text-gray-500 mb-3">📋 Thông tin nhóm</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Người tạo</span>
                <span className="font-medium text-gray-800 text-right">
                  {creator
                    ? (creator._id === currentUserId ? `${creator.name} (Bạn)` : creator.name)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Ngày tạo</span>
                <span className="font-medium text-gray-800">{formatDate(conversation.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Số thành viên</span>
                <span className="font-medium text-gray-800">{conversation.participants.length} / {MAX_GROUP}</span>
              </div>
            </div>
          </div>

          {/* TÊN NHÓM */}
          <div className="p-4 border-b border-gray-100">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">✏️ Tên nhóm</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={80}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              <button
                onClick={handleRename}
                disabled={savingName || !name.trim() || name.trim() === conversation.name}
                className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {savingName ? '...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* THÀNH VIÊN */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500">👥 Thành viên ({conversation.participants.length}/{MAX_GROUP})</p>
              {isFull && <span className="text-[10px] font-bold text-red-500">ĐÃ ĐẦY</span>}
            </div>

            <button
              onClick={() => setShowAddPicker(v => !v)}
              disabled={isFull && !showAddPicker}
              className={`w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-xl text-sm font-semibold transition-all ${
                showAddPicker
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : isFull
                    ? 'bg-red-50 text-red-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {showAddPicker
                ? '✕  Đóng danh sách'
                : isFull
                  ? `🚫  Nhóm đã đầy (${MAX_GROUP} thành viên)`
                  : `➕  Thêm thành viên mới (còn ${remainingSlots} chỗ)`}
            </button>

            <ul className="space-y-1">
              {conversation.participants.map(p => (
                <li key={p._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                  <Avatar name={p.name} avatar={p.avatar} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {p.name}
                      {p._id === currentUserId && <span className="ml-2 text-xs text-sky-500">(Bạn)</span>}
                      {creator && creator._id === p._id && <span className="ml-1 text-[10px] text-orange-500 font-bold">👑</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{p.email}</p>
                  </div>
                  {p._id !== currentUserId && (
                    <button
                      onClick={() => handleKick(p._id, p.name)}
                      disabled={pendingKick[p._id]}
                      className="px-2 py-1.5 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Xoá khỏi nhóm"
                    >
                      🗑️
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* PICKER THÊM BẠN */}
          {showAddPicker && (
            <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-orange-50 to-pink-50/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-800">👥 Thêm thành viên vào nhóm</p>
                <button
                  onClick={() => { setShowAddPicker(false); setSelectedToAdd(new Set()); setUserQuery(''); }}
                  className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>

              {/* Search box */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  placeholder="🔍 Tìm theo tên hoặc email..."
                  className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {searchingUsers && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>
                )}
              </div>

              <p className="text-[11px] text-gray-500 mb-2">
                {userQuery.trim().length >= 2
                  ? `Kết quả tìm kiếm (${displayUsers.length})`
                  : `Gợi ý — bạn bè (${addableFriends.length}) + người dùng khác`}
              </p>

              {displayUsers.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">
                  {userQuery.trim().length >= 2 ? 'Không tìm thấy ai phù hợp' : 'Không còn ai để thêm 🎉'}
                </p>
              ) : (
                <div className="space-y-1 max-h-56 overflow-y-auto bg-white/70 rounded-xl p-1">
                  {displayUsers.map(f => {
                    const isFriend = friendIdSet.has(f._id);
                    return (
                      <label key={f._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedToAdd.has(f._id)}
                          onChange={() => setSelectedToAdd(prev => {
                            const next = new Set(prev);
                            if (next.has(f._id)) next.delete(f._id); else next.add(f._id);
                            return next;
                          })}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <Avatar name={f.name} avatar={f.avatar} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{f.name}</span>
                            {isFriend && (
                              <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-semibold shrink-0">Bạn bè</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 block truncate">{f.email}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {displayUsers.length > 0 && (
                <>
                  {selectedToAdd.size > remainingSlots && (
                    <p className="text-xs text-red-500 mt-2">⚠ Vượt quá số chỗ trống ({remainingSlots})</p>
                  )}
                  <button
                    onClick={handleAdd}
                    disabled={selectedToAdd.size === 0 || adding || selectedToAdd.size > remainingSlots}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold rounded-xl disabled:opacity-40 shadow-sm"
                  >
                    {adding
                      ? 'Đang thêm...'
                      : selectedToAdd.size === 0
                        ? 'Chọn ít nhất 1 người'
                        : `✓ Thêm ${selectedToAdd.size} thành viên`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ẢNH & MEDIA */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-3">
              🖼️ Ảnh đã gửi {media.length > 0 && <span className="text-gray-400 font-normal">({media.length})</span>}
            </p>
            {media.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-3">Chưa có ảnh nào</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {media.slice(0, 12).map(m => (
                  <button
                    key={m._id}
                    onClick={() => setPreviewImg(m.content)}
                    className="aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-80 transition-opacity"
                  >
                    <img src={m.content} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LỊCH TRÌNH ĐÃ CHIA SẺ */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-3">
              🗺️ Lịch trình đã chia sẻ {itineraries.length > 0 && <span className="text-gray-400 font-normal">({itineraries.length})</span>}
            </p>
            {itineraries.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-3">Chưa có lịch trình nào</p>
            ) : (
              <ul className="space-y-2">
                {itineraries.slice(0, 5).map(it => {
                  const thumb = it.itineraryId.destinations?.[0]?.destination?.images?.[0];
                  return (
                    <li key={it._id}>
                      <a
                        href={`/itinerary/${it.itineraryId._id}?shared=1`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-sky-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-100 to-violet-100 overflow-hidden shrink-0">
                          {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{it.itineraryId.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {it.sender.name} · {formatDate(it.createdAt)}
                          </p>
                        </div>
                        <span className="text-sky-500 text-sm">→</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* DANGER ZONE */}
          <div className="p-4">
            <p className="text-xs font-semibold text-red-500 mb-2">⚠️ Vùng nguy hiểm</p>
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="w-full py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50 mb-2 border border-red-100"
            >
              {clearing ? 'Đang xoá...' : '🗑️ Xoá toàn bộ lịch sử trò chuyện'}
            </button>
          </div>
        </div>

        {/* RỜI NHÓM */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-xl text-sm disabled:opacity-50"
          >
            {leaving ? 'Đang rời...' : '🚪 Rời nhóm'}
          </button>
        </div>
      </div>

      {/* Lightbox xem ảnh */}
      {previewImg && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewImg(null); }}
            className="absolute top-4 right-4 text-white text-3xl"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
