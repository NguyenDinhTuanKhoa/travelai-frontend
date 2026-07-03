'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '../../lib/adminApi';
import { useAuth } from '../../context/AuthContext';
import DataTable, { Column } from '../_components/DataTable';
import FilterBar from '../_components/FilterBar';
import Pagination from '../_components/Pagination';
import ConfirmModal from '../_components/ConfirmModal';
import BulkActionBar from '../_components/BulkActionBar';
import Badge from '../_components/Badge';
import EmptyState from '../_components/EmptyState';
import { toast } from '../_components/Toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
  avatar?: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const dateFrom = searchParams?.get('dateFrom') || undefined;
  const dateTo = searchParams?.get('dateTo') || undefined;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [banModal, setBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminApi.getUsers({ page, search, role, status, dateFrom, dateTo });
    if (error) toast.error(error);
    if (data) {
      const result = data as { users: User[]; totalPages: number };
      setUsers(result.users);
      setTotalPages(result.totalPages);
    }
    setLoading(false);
  }, [page, search, role, status, dateFrom, dateTo]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await adminApi.updateUserRole(id, newRole);
    if (error) toast.error(error);
    else { toast.success('Đã cập nhật vai trò'); loadUsers(); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    const { error } = await adminApi.deleteUser(confirmDelete._id);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success(`Đã xóa ${confirmDelete.name}`);
      setConfirmDelete(null);
      loadUsers();
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    const { data, error } = await adminApi.bulkDeleteUsers(selectedIds);
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      const count = (data as { deletedCount: number })?.deletedCount || 0;
      toast.success(`Đã xóa ${count} người dùng`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      loadUsers();
    }
  };

  const handleBan = async () => {
    if (!banModal) return;
    setActionLoading(true);
    const { error } = await adminApi.banUser(banModal._id, banReason.trim());
    setActionLoading(false);
    if (error) toast.error(error);
    else {
      toast.success(`Đã khóa ${banModal.name}`);
      setBanModal(null);
      setBanReason('');
      loadUsers();
    }
  };

  const handleUnban = async (u: User) => {
    const { error } = await adminApi.unbanUser(u._id);
    if (error) toast.error(error);
    else { toast.success(`Đã mở khóa ${u.name}`); loadUsers(); }
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{u.name}</p>
            <p className="text-xs text-gray-500 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => handleRoleChange(u._id, e.target.value)}
          disabled={u._id === currentUser?._id}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${
            u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-700'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (u) =>
        u.isBanned ? (
          <Badge color="rose" icon="🔒">Đã khóa</Badge>
        ) : (
          <Badge color="emerald" icon="✓">Active</Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (u) => (
        <span className="text-xs text-gray-500">
          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          {u.isBanned ? (
            <button
              onClick={() => handleUnban(u)}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              🔓 Mở khóa
            </button>
          ) : (
            <button
              onClick={() => setBanModal(u)}
              disabled={u._id === currentUser?._id}
              className="px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              🔒 Khóa
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(u)}
            disabled={u._id === currentUser?._id}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            🗑 Xóa
          </button>
        </div>
      ),
    },
  ];

  const eligibleIds = users
    .filter((u) => u._id !== currentUser?._id)
    .map((u) => u._id);
  const validSelected = selectedIds.filter((id) => eligibleIds.includes(id));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h2>
          <p className="text-sm text-gray-500 mt-1">Phân quyền, khóa/mở khóa, và xóa tài khoản</p>
        </div>
        {(dateFrom || dateTo) && (
          <a
            href="/admin/users"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold rounded-xl hover:bg-violet-100 transition-colors"
          >
            📅 Đang lọc theo ngày · Bỏ lọc ✕
          </a>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Tìm theo tên hoặc email..."
        filters={[
          {
            key: 'role',
            label: 'Vai trò',
            type: 'select',
            value: role,
            onChange: (v) => { setRole(v); setPage(1); },
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ],
          },
          {
            key: 'status',
            label: 'Trạng thái',
            type: 'select',
            value: status,
            onChange: (v) => { setStatus(v); setPage(1); },
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Active' },
              { value: 'banned', label: 'Đã khóa' },
            ],
          },
        ]}
        onReset={() => { setSearch(''); setRole('all'); setStatus('all'); setPage(1); }}
      />

      <DataTable<User>
        columns={columns}
        rows={users}
        getRowId={(u) => u._id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
        emptyState={<EmptyState icon="👥" title="Không có người dùng" description="Thử reset bộ lọc hoặc đợi user mới đăng ký." />}
        rowClassName={(u) => (u.isBanned ? 'bg-rose-50/30' : '')}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BulkActionBar
        count={validSelected.length}
        onClear={() => setSelectedIds([])}
        actions={
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-sm font-semibold transition-all"
          >
            🗑 Xóa tất cả
          </button>
        }
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Xóa người dùng"
        message={<>Bạn có chắc muốn xóa <strong>{confirmDelete?.name}</strong>? Hành động này không thể hoàn tác.</>}
        confirmLabel="Xóa"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa nhiều người dùng"
        message={<>Sẽ xóa <strong>{validSelected.length}</strong> tài khoản. Không thể hoàn tác.</>}
        confirmLabel={`Xóa ${validSelected.length}`}
        danger
        loading={actionLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeInScale_0.2s_ease]">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🔒</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Khóa tài khoản</h3>
                <p className="text-sm text-gray-600 mt-0.5">Khóa <strong>{banModal.name}</strong>. User này sẽ không đăng nhập được.</p>
              </div>
            </div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lý do (tùy chọn)</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Ví dụ: spam, vi phạm điều khoản..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => { setBanModal(null); setBanReason(''); }}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl transition-all font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <span className="animate-spin">⏳</span>}
                Khóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
