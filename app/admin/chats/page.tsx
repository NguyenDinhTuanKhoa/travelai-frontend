'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../lib/adminApi';
import DataTable, { Column } from '../_components/DataTable';
import FilterBar from '../_components/FilterBar';
import Pagination from '../_components/Pagination';
import ConfirmModal from '../_components/ConfirmModal';
import BulkActionBar from '../_components/BulkActionBar';
import EmptyState from '../_components/EmptyState';
import { toast } from '../_components/Toast';

interface ChatListItem {
  _id: string;
  title: string;
  user?: { _id: string; name: string; email: string };
  lastMessage: string;
  createdAt: string;
  messageCount: number;
}

interface ChatDetail extends ChatListItem {
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
}

export default function AdminChats() {
  const [items, setItems] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<ChatListItem | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [detail, setDetail] = useState<ChatDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminApi.getChats({ page, search });
    if (error) toast.error(error);
    if (data) {
      const r = data as { chats: ChatListItem[]; totalPages: number };
      setItems(r.chats);
      setTotalPages(r.totalPages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleViewDetail = async (c: ChatListItem) => {
    setDetailLoading(true);
    setDetail({ ...c, messages: [] });
    const { data, error } = await adminApi.getChat(c._id);
    if (error) toast.error(error);
    else if (data) setDetail(data as ChatDetail);
    setDetailLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    const { error } = await adminApi.deleteChat(confirmDelete._id);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success('Đã xóa cuộc chat');
      setConfirmDelete(null);
      load();
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    const { data, error } = await adminApi.bulkDeleteChats(selectedIds);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      const count = (data as { deletedCount: number })?.deletedCount || 0;
      toast.success(`Đã xóa ${count} cuộc chat`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      load();
    }
  };

  const columns: Column<ChatListItem>[] = [
    {
      key: 'title',
      header: 'Tiêu đề',
      render: (c) => (
        <p className="font-semibold text-gray-900 truncate max-w-xs">{c.title || '(không tiêu đề)'}</p>
      ),
    },
    {
      key: 'user',
      header: 'Người dùng',
      render: (c) => c.user ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {c.user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm text-gray-700 truncate">{c.user.name}</span>
        </div>
      ) : <span className="text-xs text-gray-400 italic">(đã xóa)</span>,
    },
    {
      key: 'count',
      header: 'Tin nhắn',
      render: (c) => (
        <span className="px-2 py-1 bg-violet-50 text-violet-700 text-xs font-bold rounded-md">
          {c.messageCount || 0}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'Gần nhất',
      render: (c) => (
        <span className="text-xs text-gray-500">
          {new Date(c.lastMessage).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }}
          className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >🗑 Xóa</button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Chat history</h2>
        <p className="text-sm text-gray-500 mt-1">Xem nội dung các cuộc chat AI và moderation</p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Tìm theo tiêu đề..."
        onReset={() => { setSearch(''); setPage(1); }}
      />

      <DataTable<ChatListItem>
        columns={columns}
        rows={items}
        getRowId={(c) => c._id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
        onRowClick={handleViewDetail}
        emptyState={<EmptyState icon="💬" title="Chưa có cuộc chat nào" />}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-sm font-semibold transition-all"
          >🗑 Xóa tất cả</button>
        }
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Xóa cuộc chat"
        message={<>Xóa <strong>{confirmDelete?.title}</strong> ({confirmDelete?.messageCount} tin nhắn)? Không thể hoàn tác.</>}
        confirmLabel="Xóa"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa nhiều cuộc chat"
        message={<>Sẽ xóa <strong>{selectedIds.length}</strong> cuộc chat. Không thể hoàn tác.</>}
        confirmLabel={`Xóa ${selectedIds.length}`}
        danger
        loading={actionLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-hidden shadow-2xl border-l border-gray-200 animate-[slideInRight_0.2s_ease] flex flex-col">
            <div className="bg-white border-b border-gray-100 p-6 flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{detail.title || '(không tiêu đề)'}</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {detail.user?.name || '(unknown)'} · {detail.messageCount} tin nhắn
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg shrink-0"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full" />
                </div>
              ) : detail.messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">Không có tin nhắn</p>
              ) : (
                <div className="space-y-3">
                  {detail.messages.map((m, idx) => (
                    <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white'
                          : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white'
                      }`}>
                        {m.role === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(m.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
