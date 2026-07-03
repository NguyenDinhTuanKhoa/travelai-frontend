'use client';
import { useState, useEffect, useCallback } from 'react';
import { itineraryApi } from '../../lib/api';
import { friendApi, chatApi } from '../../lib/api';

interface FriendItem {
  _id: string;
  friendshipId: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Itinerary {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  destinations: Array<{ destination?: { name: string } }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedItineraryId?: string;
}

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) return <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />;
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function ShareItineraryModal({ open, onClose, preselectedItineraryId }: Props) {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [chosenItineraryId, setChosenItineraryId] = useState<string>('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedFriends(new Set());
    setResult(null);
    setChosenItineraryId(preselectedItineraryId || '');

    Promise.all([friendApi.list(), itineraryApi.getAll()]).then(([fRes, iRes]) => {
      if (fRes.data) setFriends(((fRes.data as { data: FriendItem[] }).data) || []);
      if (iRes.data) {
        const list = ((iRes.data as { data: Itinerary[] }).data) || [];
        setItineraries(list);
        if (!preselectedItineraryId && list.length > 0) {
          setChosenItineraryId(list[0]._id);
        }
      }
    });
  }, [open, preselectedItineraryId]);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (!chosenItineraryId || selectedFriends.size === 0) return;
    setSending(true);
    let ok = 0;
    let fail = 0;

    for (const friendId of selectedFriends) {
      const convRes = await chatApi.getOrCreateDirect(friendId);
      if (convRes.error || !convRes.data) { fail++; continue; }
      const conv = (convRes.data as { data: { _id: string } }).data;

      const msgRes = await chatApi.sendMessage(conv._id, {
        type: 'itinerary_share',
        itineraryId: chosenItineraryId,
      });
      if (msgRes.error) fail++;
      else ok++;
    }

    setResult({ ok, fail });
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">Chia sẻ lịch trình</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {result ? (
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">{result.fail === 0 ? '✅' : '⚠️'}</div>
            <p className="font-bold text-lg mb-2">
              {result.fail === 0 ? 'Đã chia sẻ thành công!' : `Hoàn tất với ${result.fail} lỗi`}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Gửi tới {result.ok}/{result.ok + result.fail} người
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-sky-500 text-white font-semibold rounded-xl"
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            {!preselectedItineraryId && (
              <div className="p-4 border-b border-gray-100">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Chọn lịch trình</label>
                {itineraries.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Bạn chưa có lịch trình nào</p>
                ) : (
                  <select
                    value={chosenItineraryId}
                    onChange={e => setChosenItineraryId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {itineraries.map(i => (
                      <option key={i._id} value={i._id}>{i.title}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-gray-500">Chọn bạn để chia sẻ</p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {friends.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Chưa có bạn nào để chia sẻ</p>
              ) : (
                friends.map(f => (
                  <label key={f._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFriends.has(f._id)}
                      onChange={() => toggleFriend(f._id)}
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
              <span className="text-xs text-gray-500">Đã chọn {selectedFriends.size} người</span>
              <button
                onClick={handleShare}
                disabled={!chosenItineraryId || selectedFriends.size === 0 || sending}
                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {sending ? 'Đang gửi...' : '📨 Gửi'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
