import { useEffect, useState } from 'react';
import {
  Plus, Pencil, UserX, UserCheck, Loader2,
  Shield, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const ROLES = ['admin', 'manager', 'viewer'];
const ROLE_BADGE_VARIANT = {
  admin:   'danger',
  manager: 'warning',
  viewer:  'muted',
};

function RoleBadge({ role }) {
  return (
    <Badge variant={ROLE_BADGE_VARIANT[role] ?? 'muted'} className="capitalize">
      {role}
    </Badge>
  );
}

function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'viewer', department: '' });
  const [editForm, setEditForm] = useState({ name: '', role: 'viewer', department: '', isActive: true });

  const [toggleLoading, setToggleLoading] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filterRole) params.role = filterRole;
      const res = await api.get('/users', { params });
      let data = res.data.data;
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      setUsers(data);
      setTotal(res.data.pagination?.total ?? data.length);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, [filterRole]);
  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search]);

  function openEdit(u) {
    setEditTarget(u);
    setEditForm({ name: u.name, role: u.role, department: u.department || '', isActive: u.isActive });
    setEditOpen(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/users/register', addForm);
      toast.success('User created');
      setAddOpen(false);
      setAddForm({ name: '', email: '', password: '', role: 'viewer', department: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.put(`/users/${editTarget._id}`, editForm);
      toast.success('User updated');
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleActive(u) {
    if (u._id === me?._id) { toast.error("You can't deactivate your own account"); return; }
    setToggleLoading(u._id);
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setToggleLoading(null);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} team members</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">User</th>
              <th className="table-th">Role</th>
              <th className="table-th">Department</th>
              <th className="table-th">Status</th>
              <th className="table-th">Joined</th>
              <th className="table-th w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="table-td text-center py-12">
                <Loader2 size={20} className="animate-spin mx-auto text-primary" />
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="table-td text-center py-12 text-muted-foreground">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                        {u.name}
                        {u._id === me?._id && <span className="text-xs text-primary">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td"><RoleBadge role={u.role} /></td>
                <td className="table-td text-sm text-gray-600">{u.department || <span className="text-muted-foreground">—</span>}</td>
                <td className="table-td">
                  <Badge variant={u.isActive ? 'success' : 'muted'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="table-td text-xs text-muted-foreground">
                  {u.createdAt && !isNaN(new Date(u.createdAt))
                    ? format(new Date(u.createdAt), 'dd MMM yyyy')
                    : '—'}
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    {u._id !== me?._id && (
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={toggleLoading === u._id}
                        className={`p-1.5 rounded-md transition-colors ${
                          u.isActive
                            ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {toggleLoading === u._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : u.isActive ? <UserX size={14} /> : <UserCheck size={14} />
                        }
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New User">
        <form onSubmit={handleAdd} className="space-y-4">
          {[
            { field: 'name', label: 'Full Name *', type: 'text', required: true, placeholder: 'Jane Smith' },
            { field: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'jane@company.com' },
            { field: 'password', label: 'Password *', type: 'password', required: true, placeholder: '8+ chars, 1 number' },
            { field: 'department', label: 'Department', type: 'text', required: false, placeholder: 'Engineering' },
          ].map(({ field, label, type, required, placeholder }) => (
            <div key={field}>
              <Label className="mb-1 block">{label}</Label>
              <Input type={type} required={required} placeholder={placeholder}
                value={addForm[field]} onChange={(e) => setAddForm({ ...addForm, [field]: e.target.value })} />
            </div>
          ))}
          <div>
            <Label className="mb-1 block">Role</Label>
            <select className="input" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading && <Loader2 size={14} className="animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${editTarget?.name}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Full Name</Label>
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1 block">Department</Label>
            <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1 block">Role</Label>
            <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input id="isActive" type="checkbox" checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={editTarget?._id === me?._id}
            />
            <Label htmlFor="isActive" className="text-sm text-gray-700">Account active</Label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
