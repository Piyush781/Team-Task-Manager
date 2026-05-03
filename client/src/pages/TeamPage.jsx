import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersApi, updateRoleApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const TeamPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    getUsersApi().then(r => setUsers(r.data)).catch(() => addToast('Failed to load users', 'error')).finally(() => setLoading(false));
  }, [user]);

  const handleToggleRole = async () => {
    setSubmitting(true);
    try {
      const newRole = confirm.currentRole === 'admin' ? 'member' : 'admin';
      const res = await updateRoleApi(confirm.id, newRole);
      setUsers(prev => prev.map(u => u._id === confirm.id ? res.data : u));
      addToast(`Role updated to ${newRole}`, 'success');
      setConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-16"><Spinner size={32} /></div></Layout>;

  return (
    <Layout>
      <TopBar title="Team" subtitle={`${users.length} member${users.length !== 1 ? 's' : ''}`} />

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500 uppercase tracking-wide"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              <th className="text-left px-5 py-3">User</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf = u._id === user?._id;
              return (
                <tr key={u._id}
                  className="border-b last:border-0 transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: isSelf ? 'rgba(99,102,241,0.06)' : undefined
                  }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold text-xs shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{u.name}</div>
                        {isSelf && <div className="text-xs text-indigo-400">You</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{u.email}</td>
                  <td className="px-5 py-4"><Badge type="role" value={u.role} /></td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    {!isSelf && (
                      <button
                        onClick={() => setConfirm({ id: u._id, name: u.name, currentRole: u.role })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                        Make {u.role === 'admin' ? 'Member' : 'Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleToggleRole}
        loading={submitting}
        title="Change Role"
        message={`Change ${confirm?.name}'s role to ${confirm?.currentRole === 'admin' ? 'Member' : 'Admin'}?`}
        confirmLabel="Change Role"
        variant="primary"
      />
    </Layout>
  );
};

export default TeamPage;