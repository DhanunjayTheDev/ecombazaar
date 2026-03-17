import { useState, useEffect, useCallback } from 'react';
import { Search, Ban, Trash2, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', type: '', data: null, isLoading: false });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      if (data.success && data.users) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
      setUsers([]);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBlock = async (id) => {
    try {
      const { data } = await api.put(`/users/${id}/block`);
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: data.user.isBlocked } : u));
        toast.success(data.user.isBlocked ? 'User blocked' : 'User unblocked');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const deleteUser = (id) => {
    setConfirmDialog({ isOpen: true, message: 'This user will be permanently deleted.', type: 'delete', data: { id }, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    const { id } = confirmDialog.data;
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    try {
      const { data } = await api.delete(`/users/${id}`);
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== id));
        toast.success('User deleted successfully');
        setConfirmDialog({ isOpen: false, message: '', type: '', data: null, isLoading: false });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Users</h1>
        <p className="text-sm text-gray-500">{users.length} registered users</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 gap-2 max-w-sm">
          <Search size={15} className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="outline-none text-sm flex-1" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Email', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
                </tr>
              )) : filtered.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleBlock(user._id)} title={user.isBlocked ? 'Unblock' : 'Block'} className={`transition ${user.isBlocked ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-orange-500'}`}>
                        {user.isBlocked ? <ShieldCheck size={16} /> : <Ban size={16} />}
                      </button>
                      <button onClick={() => deleteUser(user._id)} className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Dialog ──────────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete User?"
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', type: '', data: null, isLoading: false })}
      />
    </div>
  );
}
