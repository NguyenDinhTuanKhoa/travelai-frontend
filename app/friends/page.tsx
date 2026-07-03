'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { friendApi, chatApi } from '../lib/api';

interface UserBrief {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface FriendItem extends UserBrief {
  friendshipId: string;
  since?: string;
}

interface RequestItem extends UserBrief {
  friendshipId: string;
  createdAt: string;
}

type Tab = 'friends' | 'incoming' | 'outgoing' | 'search';

function Avatar({ name, avatar, size = 48 }: { name: string; avatar?: string; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover bg-gray-100"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold"
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserBrief[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    refreshAll();
  }, [user, authLoading]);

  const refreshAll = async () => {
    setLoading(true);
    const [fRes, rRes] = await Promise.all([friendApi.list(), friendApi.requests()]);
    if (fRes.data) setFriends(((fRes.data as { data: FriendItem[] }).data) || []);
    if (rRes.data) {
      const d = (rRes.data as { data: { incoming: RequestItem[]; outgoing: RequestItem[] } }).data;
      setIncoming(d.incoming || []);
      setOutgoing(d.outgoing || []);
    }
    setLoading(false);
  };

  // Debounced search — q rỗng cũng gọi để show gợi ý
  useEffect(() => {
    if (tab !== 'search') return;
    const handler = setTimeout(async () => {
      setSearching(true);
      const res = await friendApi.search(searchQuery.trim());
      if (res.data) setSearchResults(((res.data as { data: UserBrief[] }).data) || []);
      setSearching(false);
    }, searchQuery.trim().length === 0 ? 0 : 350);
    return () => clearTimeout(handler);
  }, [searchQuery, tab]);

  const setPending = (key: string, val: boolean) =>
    setPendingActions(prev => ({ ...prev, [key]: val }));

  const handleSendRequest = async (recipientId: string) => {
    setPending(`send:${recipientId}`, true);
    const res = await friendApi.sendRequest(recipientId);
    setPending(`send:${recipientId}`, false);
    if (res.error) {
      alert(res.error);
      return;
    }
    // Remove from search results, refresh outgoing
    setSearchResults(prev => prev.filter(u => u._id !== recipientId));
    refreshAll();
  };

  const handleRespond = async (friendshipId: string, action: 'accept' | 'reject') => {
    setPending(`respond:${friendshipId}`, true);
    const res = await friendApi.respond(friendshipId, action);
    setPending(`respond:${friendshipId}`, false);
    if (res.error) {
      alert(res.error);
      return;
    }
    refreshAll();
  };

  const handleRemove = async (friendshipId: string, label: string) => {
    if (!confirm(`${label}?`)) return;
    setPending(`remove:${friendshipId}`, true);
    const res = await friendApi.remove(friendshipId);
    setPending(`remove:${friendshipId}`, false);
    if (res.error) {
      alert(res.error);
      return;
    }
    refreshAll();
  };

  const handleOpenChat = async (friendId: string) => {
    const res = await chatApi.getOrCreateDirect(friendId);
    if (res.error || !res.data) {
      alert(res.error || 'Lỗi mở chat');
      return;
    }
    const conv = (res.data as { data: { _id: string } }).data;
    router.push(`/chat?conversation=${conv._id}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-violet-50/20">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'friends', label: 'Bạn bè', icon: '👥', count: friends.length },
    { id: 'incoming', label: 'Lời mời đến', icon: '📥', count: incoming.length },
    { id: 'outgoing', label: 'Lời mời đi', icon: '📤', count: outgoing.length },
    { id: 'search', label: 'Tìm bạn', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-violet-50/20">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="relative mb-6 bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 rounded-3xl p-6 md:p-8 overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🤝</span>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Bạn Bè</h1>
              </div>
              <p className="text-white/80 text-base max-w-xl">
                Kết nối, chia sẻ lịch trình du lịch với bạn bè của bạn.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-6">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 rounded-xl font-medium transition-all text-sm flex items-center gap-1.5 ${
                    tab === t.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {typeof t.count === 'number' && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {tab === 'search' && (
              <div className="p-4">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 text-sm"
                  />
                </div>
                {searching ? (
                  <p className="text-center py-8 text-gray-400 text-sm">Đang tải...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    {searchQuery.trim().length >= 2
                      ? 'Không tìm thấy ai phù hợp'
                      : 'Chưa có người dùng nào để gợi ý'}
                  </p>
                ) : (
                  <>
                    {searchQuery.trim().length < 2 && (
                      <p className="px-1 pb-2 text-xs text-gray-400">
                        ✨ Gợi ý kết bạn — nhập để tìm cụ thể
                      </p>
                    )}
                    <ul className="divide-y divide-gray-100">
                      {searchResults.map(u => (
                        <li key={u._id} className="py-3 flex items-center gap-3">
                          <Avatar name={u.name} avatar={u.avatar} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          <button
                            onClick={() => handleSendRequest(u._id)}
                            disabled={pendingActions[`send:${u._id}`]}
                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-all"
                          >
                            {pendingActions[`send:${u._id}`] ? '...' : '＋ Kết bạn'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {tab === 'friends' && (
              <div className="p-4">
                {loading ? (
                  <p className="text-center py-8 text-gray-400 text-sm">Đang tải...</p>
                ) : friends.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-5xl">👋</span>
                    <p className="text-gray-500 mt-3 mb-4">Bạn chưa có bạn nào. Hãy tìm và kết bạn!</p>
                    <button
                      onClick={() => setTab('search')}
                      className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-violet-500 text-white font-semibold rounded-xl"
                    >
                      🔍 Tìm bạn ngay
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {friends.map(f => (
                      <li key={f.friendshipId} className="py-3 flex items-center gap-3">
                        <Avatar name={f.name} avatar={f.avatar} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                          <p className="text-xs text-gray-500 truncate">{f.email}</p>
                        </div>
                        <button
                          onClick={() => handleOpenChat(f._id)}
                          className="px-4 py-2 text-sm font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-all"
                        >
                          💬 Nhắn tin
                        </button>
                        <button
                          onClick={() => handleRemove(f.friendshipId, `Huỷ kết bạn với ${f.name}`)}
                          disabled={pendingActions[`remove:${f.friendshipId}`]}
                          className="px-3 py-2 text-xs font-medium rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                          title="Huỷ kết bạn"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'incoming' && (
              <div className="p-4">
                {loading ? (
                  <p className="text-center py-8 text-gray-400 text-sm">Đang tải...</p>
                ) : incoming.length === 0 ? (
                  <p className="text-center py-12 text-gray-400">Không có lời mời nào</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {incoming.map(r => (
                      <li key={r.friendshipId} className="py-3 flex items-center gap-3">
                        <Avatar name={r.name} avatar={r.avatar} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-500 truncate">{r.email}</p>
                        </div>
                        <button
                          onClick={() => handleRespond(r.friendshipId, 'accept')}
                          disabled={pendingActions[`respond:${r.friendshipId}`]}
                          className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                        >
                          ✓ Đồng ý
                        </button>
                        <button
                          onClick={() => handleRespond(r.friendshipId, 'reject')}
                          disabled={pendingActions[`respond:${r.friendshipId}`]}
                          className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-all"
                        >
                          ✕ Từ chối
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'outgoing' && (
              <div className="p-4">
                {loading ? (
                  <p className="text-center py-8 text-gray-400 text-sm">Đang tải...</p>
                ) : outgoing.length === 0 ? (
                  <p className="text-center py-12 text-gray-400">Không có lời mời đang gửi</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {outgoing.map(r => (
                      <li key={r.friendshipId} className="py-3 flex items-center gap-3">
                        <Avatar name={r.name} avatar={r.avatar} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-500 truncate">{r.email}</p>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">Chờ phản hồi</span>
                        <button
                          onClick={() => handleRemove(r.friendshipId, `Huỷ lời mời gửi tới ${r.name}`)}
                          disabled={pendingActions[`remove:${r.friendshipId}`]}
                          className="px-3 py-2 text-xs font-medium rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                          title="Huỷ"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
