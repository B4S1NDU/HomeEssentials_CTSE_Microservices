import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Edit2, ShieldCheck } from 'lucide-react';
import { usersApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import EditUserForm from './EditUserForm';
import toast from 'react-hot-toast';
import { extractErrorMessage, formatDate, getRoleBadgeColor, getInitials } from '../../utils/helpers';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page, limit: 10 });
      const d = res.data?.data ?? res.data;
      setUsers(d.users ?? []);
      setTotalPages(d.pagination?.pages ?? 1);
      setTotal(d.pagination?.total ?? 0);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
        <ShieldCheck size={48} />
        <div className="text-center">
          <p className="font-semibold text-gray-600">Access Restricted</p>
          <p className="text-sm">Only Admins can view the user list.</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'firstName',
      label: 'User',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {getInitials(row.firstName, row.lastName)}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <Badge className={getRoleBadgeColor(val) + ' border-transparent'}>{val}</Badge>
      ),
    },
    {
      key: 'address',
      label: 'Location',
      render: (val) =>
        val?.city ? (
          <span className="text-gray-500 text-sm">{val.city}, {val.country}</span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (val) => <span className="text-gray-500 text-xs">{formatDate(val)}</span>,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setEditUser(row)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Edit2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500">{total} registered user{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={users} loading={loading} emptyMessage="No users found." />
        <div className="p-4 border-t border-gray-100">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        size="md"
      >
        <EditUserForm user={editUser} onSaved={() => { setEditUser(null); fetchUsers(); }} onCancel={() => setEditUser(null)} />
      </Modal>
    </div>
  );
}
