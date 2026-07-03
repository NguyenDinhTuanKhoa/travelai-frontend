'use client';
import ItineraryShareCard from './ItineraryShareCard';

interface MessageSender {
  _id: string;
  name: string;
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
  sender: MessageSender;
  createdAt: string;
}

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageItem({
  message,
  isOwn,
  showAvatar,
  showName,
}: {
  message: MessageData;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
}) {
  const bubbleClass = isOwn
    ? 'bg-gradient-to-br from-sky-500 to-violet-500 text-white'
    : 'bg-white text-gray-800 border border-gray-200';

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-2' : 'mt-0.5'}`}>
      <div className="w-8 shrink-0">
        {showAvatar && !isOwn && <Avatar name={message.sender.name} avatar={message.sender.avatar} />}
      </div>
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {showName && !isOwn && (
          <p className="text-[11px] text-gray-500 mb-0.5 px-1">{message.sender.name}</p>
        )}
        {message.type === 'itinerary_share' && message.itineraryId ? (
          <div className={`rounded-2xl overflow-hidden ${isOwn ? '' : ''}`}>
            <ItineraryShareCard itinerary={message.itineraryId} />
          </div>
        ) : message.type === 'image' && message.content ? (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden shadow-sm">
            <img
              src={message.content}
              alt="Ảnh đã gửi"
              className="max-w-[240px] max-h-[320px] object-cover block"
            />
          </a>
        ) : (
          <div className={`px-3.5 py-2 rounded-2xl shadow-sm ${bubbleClass}`}>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
          </div>
        )}
        <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
