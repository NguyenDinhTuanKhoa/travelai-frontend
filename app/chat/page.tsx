'use client';
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../lib/api';
import { useChatSocket } from '../hooks/useChatSocket';
import MessageItem from '../components/chat/MessageItem';
import NewConversationModal from '../components/chat/NewConversationModal';
import ShareItineraryModal from '../components/chat/ShareItineraryModal';
import GroupSettingsModal from '../components/chat/GroupSettingsModal';

interface Participant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface MessageData {
  _id: string;
  type: 'text' | 'itinerary_share' | 'image';
  content?: string;
  itineraryId?: {
    _id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    destinations: Array<{ destination?: { _id: string; name: string; images?: string[]; location?: { city?: string } } }>;
  };
  sender: { _id: string; name: string; avatar?: string };
  createdAt: string;
}

interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name: string;
  participants: Participant[];
  lastMessage?: MessageData;
  lastActivity: string;
  unreadCount?: number;
  createdBy?: { _id: string; name: string; avatar?: string } | string;
  createdAt?: string;
}

const EMOJI_LIST = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩','🥳','🤗','🤔','😅','😉','😋','😜','🙃','😴','😭','😢','😡','🤯','😱','😨','🥺','🙄','😏','🤤','🤐','🤫','🤥','🤒','🤧','🥶','🥵','💀','👻','💩','🤡','👍','👎','👏','🙏','💪','🤝','✌️','🤘','👌','🫶','❤️','💔','💖','💯','🔥','✨','🎉','🎂','🌟','⭐','☀️','🌈','🌹','🍀','🍕','🍔','🍟','☕','🍺','🍷','🎵','🎁','📌','✅','❌'];

async function resizeImageToDataUrl(file: File, maxSize = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas không khả dụng'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Không đọc được ảnh'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });
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

function getConvDisplayName(conv: Conversation, myId: string): { name: string; avatar?: string } {
  if (conv.type === 'group') return { name: conv.name || `Nhóm (${conv.participants.length})` };
  const other = conv.participants.find(p => p._id !== myId) || conv.participants[0];
  return { name: other?.name || 'Người dùng', avatar: other?.avatar };
}

function formatRelative(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)}p`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('conversation'));
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeIdRef = useRef<string | null>(activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    refreshConversations();
  }, [user, authLoading]);

  const refreshConversations = useCallback(async () => {
    const res = await chatApi.listConversations();
    if (res.data) {
      const list = ((res.data as { data: Conversation[] }).data) || [];
      setConversations(list);
      if (!activeId && list.length > 0) {
        setActiveId(list[0]._id);
      }
    }
  }, [activeId]);

  // Load messages khi activeId đổi
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    chatApi.getMessages(activeId).then(res => {
      if (res.data) {
        const d = (res.data as { data: { messages: MessageData[]; hasMore: boolean } }).data;
        setMessages(d.messages || []);
        setHasMore(d.hasMore);
        // Scroll to bottom after render
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        });
      }
      setLoadingMessages(false);
    });
    // Mark as read + zero local unread badge
    chatApi.markRead(activeId).catch(() => {});
    setConversations(prev => prev.map(c => c._id === activeId ? { ...c, unreadCount: 0 } : c));
  }, [activeId]);

  // Load more on scroll top
  const handleScroll = () => {
    if (!listRef.current || loadingMore || !hasMore || !activeId || messages.length === 0) return;
    if (listRef.current.scrollTop < 40) {
      const oldestId = messages[0]._id;
      setLoadingMore(true);
      prevScrollHeightRef.current = listRef.current.scrollHeight;
      chatApi.getMessages(activeId, oldestId).then(res => {
        if (res.data) {
          const d = (res.data as { data: { messages: MessageData[]; hasMore: boolean } }).data;
          setMessages(prev => [...(d.messages || []), ...prev]);
          setHasMore(d.hasMore);
          // Maintain scroll position
          requestAnimationFrame(() => {
            if (listRef.current) {
              const newHeight = listRef.current.scrollHeight;
              listRef.current.scrollTop = newHeight - prevScrollHeightRef.current;
            }
          });
        }
        setLoadingMore(false);
      });
    }
  };

  // Socket: nhận message realtime
  useChatSocket({
    conversationId: activeId,
    onMessage: (msg) => {
      const message = msg as MessageData;
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    },
    onConversationUpdated: (update) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === update.conversationId);
        if (idx === -1) {
          // New conversation, refresh full list
          refreshConversations();
          return prev;
        }
        const lastMsg = update.lastMessage as MessageData | undefined;
        const isActive = activeIdRef.current === update.conversationId;
        const isOwn = lastMsg?.sender?._id === user?._id;
        const updated = [...prev];
        const shouldIncrement = !isActive && !isOwn;
        updated[idx] = {
          ...updated[idx],
          lastMessage: lastMsg,
          lastActivity: update.lastActivity,
          unreadCount: shouldIncrement
            ? (updated[idx].unreadCount || 0) + 1
            : updated[idx].unreadCount,
        };
        // Re-sort by lastActivity
        updated.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        return updated;
      });
    },
    onConversationMetaUpdated: (update) => {
      const newConv = update.conversation as Conversation;
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === update.conversationId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newConv };
        return updated;
      });
    },
    onRemovedFromConversation: (update) => {
      setConversations(prev => prev.filter(c => c._id !== update.conversationId));
      setActiveId(prev => prev === update.conversationId ? null : prev);
    },
    onConversationDeleted: (update) => {
      setConversations(prev => prev.filter(c => c._id !== update.conversationId));
      setActiveId(prev => prev === update.conversationId ? null : prev);
    },
    onConversationCleared: (update) => {
      if (activeIdRef.current === update.conversationId) {
        setMessages([]);
        setHasMore(false);
      }
      setConversations(prev => prev.map(c =>
        c._id === update.conversationId
          ? { ...c, lastMessage: undefined, unreadCount: 0 }
          : c
      ));
    },
  });

  const handleSend = async () => {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    const res = await chatApi.sendMessage(activeId, { type: 'text', content: text });
    if (res.error) {
      alert(res.error);
      setInput(text);
    } else if (res.data) {
      const msg = (res.data as { data: MessageData }).data;
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    setSending(false);
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeId) return;
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chọn được file ảnh');
      return;
    }
    setUploadingImage(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 800, 0.75);
      const res = await chatApi.sendMessage(activeId, { type: 'image', content: dataUrl });
      if (res.error) {
        alert(res.error);
      } else if (res.data) {
        const msg = (res.data as { data: MessageData }).data;
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
    } catch (err) {
      alert((err as Error).message || 'Lỗi gửi ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setEmojiOpen(false);
  };

  const handleCreateConv = async (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string }) => {
    const res = await chatApi.createConversation(data);
    if (res.error || !res.data) {
      alert(res.error || 'Lỗi tạo hội thoại');
      return;
    }
    const conv = (res.data as { data: Conversation }).data;
    setNewConvOpen(false);
    await refreshConversations();
    setActiveId(conv._id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  const activeConv = conversations.find(c => c._id === activeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-violet-50/20">
      <Navbar />

      <div className="pt-20 pb-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex"
               style={{ height: 'calc(100vh - 7rem)' }}>

            {/* Sidebar */}
            <aside className="w-72 lg:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
              <div className="p-3 border-b border-gray-100 bg-white flex items-center justify-between gap-2">
                <h2 className="font-bold text-gray-900">💬 Hội thoại</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setNewGroupOpen(true)}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                    title="Tạo nhóm chat"
                  >
                    👥 Nhóm
                  </button>
                  <button
                    onClick={() => setNewConvOpen(true)}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-sky-500 to-violet-500 text-white text-xs font-semibold rounded-lg"
                    title="Tin nhắn mới"
                  >
                    + Mới
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Chưa có hội thoại nào.
                    <button
                      onClick={() => setNewConvOpen(true)}
                      className="block mx-auto mt-3 px-4 py-2 text-sky-600 font-semibold text-xs"
                    >
                      Bắt đầu chat →
                    </button>
                  </div>
                ) : (
                  conversations.map(c => {
                    const meta = getConvDisplayName(c, user._id);
                    const isActive = c._id === activeId;
                    const preview = c.lastMessage
                      ? c.lastMessage.type === 'itinerary_share'
                        ? '📎 Đã chia sẻ lịch trình'
                        : c.lastMessage.type === 'image'
                          ? '🖼️ Hình ảnh'
                          : c.lastMessage.content
                      : 'Chưa có tin nhắn';
                    const unread = c.unreadCount || 0;
                    const hasUnread = unread > 0 && !isActive;
                    return (
                      <button
                        key={c._id}
                        onClick={() => setActiveId(c._id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 border-b border-gray-100 hover:bg-white transition-colors text-left ${
                          isActive ? 'bg-white' : ''
                        }`}
                      >
                        <Avatar name={meta.name} avatar={meta.avatar} size={44} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>{meta.name}</p>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatRelative(c.lastActivity)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate ${hasUnread ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>{preview}</p>
                            {hasUnread && (
                              <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Chat Panel */}
            <main className="flex-1 flex flex-col">
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center text-center text-gray-400">
                  <div>
                    <div className="text-6xl mb-3">💬</div>
                    <p className="font-medium">Chọn một hội thoại để bắt đầu</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
                    {(() => {
                      const meta = getConvDisplayName(activeConv, user._id);
                      return (
                        <>
                          <Avatar name={meta.name} avatar={meta.avatar} size={40} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{meta.name}</p>
                            <p className="text-xs text-gray-500">
                              {activeConv.type === 'group' ? `Nhóm · ${activeConv.participants.length} thành viên` : 'Trò chuyện riêng'}
                            </p>
                          </div>
                          {activeConv.type === 'group' && (
                            <button
                              onClick={() => setGroupSettingsOpen(true)}
                              className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                              title="Cài đặt nhóm"
                            >
                              ⚙️
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Messages */}
                  <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-3 bg-gradient-to-b from-slate-50/50 to-white"
                  >
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm">
                        <p className="text-3xl mb-2">👋</p>
                        Chưa có tin nhắn — hãy gửi lời chào!
                      </div>
                    ) : (
                      <>
                        {loadingMore && (
                          <div className="flex justify-center py-2">
                            <div className="animate-spin w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full" />
                          </div>
                        )}
                        {!hasMore && !loadingMore && (
                          <p className="text-center text-[11px] text-gray-300 py-2">— Bắt đầu hội thoại —</p>
                        )}
                        {messages.map((m, idx) => {
                          const prev = messages[idx - 1];
                          const isOwn = m.sender._id === user._id;
                          const senderChanged = !prev || prev.sender._id !== m.sender._id;
                          // Time gap > 5 min
                          const gap = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
                          const showAvatar = senderChanged || gap > 5 * 60 * 1000;
                          const showName = activeConv.type === 'group' && !isOwn && showAvatar;
                          return (
                            <MessageItem
                              key={m._id}
                              message={m}
                              isOwn={isOwn}
                              showAvatar={showAvatar}
                              showName={showName}
                            />
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="p-3 border-t border-gray-100 bg-white relative">
                    {emojiOpen && (
                      <div className="absolute bottom-full left-0 right-0 mx-3 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 max-h-56 overflow-y-auto z-20">
                        <div className="grid grid-cols-10 gap-1">
                          {EMOJI_LIST.map(e => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => insertEmoji(e)}
                              className="text-xl p-1 hover:bg-sky-50 rounded-md"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageSelected}
                    />
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => setShareOpen(true)}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-xl text-lg transition-colors shrink-0"
                        title="Chia sẻ lịch trình"
                      >
                        📎
                      </button>
                      <button
                        onClick={handlePickImage}
                        disabled={uploadingImage}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-sky-50 text-gray-600 hover:text-sky-600 rounded-xl text-lg transition-colors shrink-0 disabled:opacity-50"
                        title="Gửi ảnh"
                      >
                        {uploadingImage ? '⏳' : '🖼️'}
                      </button>
                      <button
                        onClick={() => setEmojiOpen(v => !v)}
                        className={`px-3 py-2.5 rounded-xl text-lg transition-colors shrink-0 ${emojiOpen ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 hover:bg-yellow-50 text-gray-600 hover:text-yellow-600'}`}
                        title="Biểu cảm"
                      >
                        😊
                      </button>
                      <textarea
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 text-sm resize-none max-h-32"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-violet-500 text-white font-semibold rounded-xl disabled:opacity-50 shrink-0"
                      >
                        {sending ? '...' : 'Gửi'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      <NewConversationModal
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onSubmit={handleCreateConv}
      />
      <NewConversationModal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        onSubmit={async (data) => {
          await handleCreateConv(data);
          setNewGroupOpen(false);
        }}
        forceGroup
      />
      <ShareItineraryModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <GroupSettingsModal
        open={groupSettingsOpen}
        onClose={() => setGroupSettingsOpen(false)}
        conversation={activeConv && activeConv.type === 'group' ? activeConv : null}
        currentUserId={user._id}
        onUpdated={(updated) => {
          setConversations(prev => prev.map(c => c._id === updated._id ? { ...c, ...updated } : c));
        }}
        onLeft={(convId) => {
          setConversations(prev => prev.filter(c => c._id !== convId));
          setActiveId(null);
        }}
        onCleared={(convId) => {
          if (activeId === convId) {
            setMessages([]);
            setHasMore(false);
          }
          setConversations(prev => prev.map(c =>
            c._id === convId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c
          ));
        }}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
