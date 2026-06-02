import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { adminApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatDate';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users({ search: debouncedSearch || undefined, role: role || undefined, page, limit: 10 })
      .then((res) => {
        setUsers(res.data.users || []);
        setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, role, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(1), [debouncedSearch, role]);

  const toggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user._id, !user.isActive);
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
            {u.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-textPrimary">{u.name}</p>
            <p className="text-xs text-textSecondary">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge tone={u.role === 'admin' ? 'gold' : 'gray'}>{u.role}</Badge>,
    },
    { key: 'joined', header: 'Joined', render: (u) => <span className="text-sm text-textSecondary">{formatDate(u.createdAt)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleStatus(u)}
            className={`text-xs ${u.isActive ? 'text-error hover:underline' : 'text-success hover:underline'}`}
          >
            {u.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <Link to={`/admin/users/${u._id}`} className="text-textSecondary hover:text-accent" aria-label="View">
            <Eye size={16} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-textPrimary">Users</h1>
        <p className="mt-1 text-sm text-textSecondary">{meta.total} users</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="input py-2.5 pl-9 text-sm" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none">
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />

      {meta.pages > 1 && (
        <div className="mt-6">
          <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
