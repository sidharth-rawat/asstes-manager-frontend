import { useEffect, useState } from 'react';
import { Check, X, Shield, Crown, Eye, Users, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

/* ─── Permission matrix definition ──────────────────────────────── */
const SECTIONS = [
  {
    label: 'Assets',
    rows: [
      { label: 'View all assets',           admin: true,  manager: true,  viewer: true  },
      { label: 'Create assets',             admin: true,  manager: true,  viewer: false },
      { label: 'Edit assets',               admin: true,  manager: true,  viewer: false },
      { label: 'Delete assets',             admin: true,  manager: false, viewer: false },
      { label: 'Bulk assign assets',        admin: true,  manager: true,  viewer: false },
      { label: 'View assignment history',   admin: true,  manager: true,  viewer: true  },
    ],
  },
  {
    label: 'Locations',
    rows: [
      { label: 'View location tree',        admin: true,  manager: true,  viewer: true  },
      { label: 'Create locations',          admin: true,  manager: true,  viewer: false },
      { label: 'Edit locations',            admin: true,  manager: true,  viewer: false },
      { label: 'Delete / deactivate',       admin: true,  manager: false, viewer: false },
    ],
  },
  {
    label: 'Users',
    rows: [
      { label: 'View user list',            admin: true,  manager: true,  viewer: false },
      { label: 'Create users',              admin: true,  manager: false, viewer: false },
      { label: 'Edit user details',         admin: true,  manager: false, viewer: false },
      { label: 'Assign / change roles',     admin: true,  manager: false, viewer: false },
      { label: 'Activate / deactivate',     admin: true,  manager: false, viewer: false },
    ],
  },
  {
    label: 'Audit Log',
    rows: [
      { label: 'View audit trail',          admin: true,  manager: true,  viewer: false },
      { label: 'Filter by user / action',   admin: true,  manager: true,  viewer: false },
    ],
  },
  {
    label: 'Role Management',
    rows: [
      { label: 'View permission matrix',    admin: true,  manager: true,  viewer: false },
      { label: 'Reassign roles',            admin: true,  manager: false, viewer: false },
    ],
  },
];

const ROLES = ['admin', 'manager', 'viewer'];

const ROLE_META = {
  admin: {
    label: 'Admin',
    icon: Crown,
    color: 'text-red-600',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    badge: 'bg-red-100 text-red-700',
    desc: 'Full access. Manages users, roles, locations, and all assets.',
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    desc: 'Can create and edit assets and locations. Can view users and audit logs.',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    ring: 'ring-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    desc: 'Read-only access to assets and locations. Cannot modify any data.',
  },
};

/* ─── Cell ───────────────────────────────────────────────────────── */
function Cell({ allowed }) {
  return (
    <td className="px-4 py-2.5 text-center">
      {allowed ? (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
          <Check size={11} className="text-emerald-600" strokeWidth={3} />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100">
          <X size={11} className="text-gray-300" strokeWidth={3} />
        </span>
      )}
    </td>
  );
}

/* ─── Role card ──────────────────────────────────────────────────── */
function RoleCard({ role }) {
  const m = ROLE_META[role];
  const Icon = m.icon;
  return (
    <div className={`card p-5 border ${m.ring}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.bg}`}>
          <Icon size={16} className={m.color} />
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.badge}`}>{m.label}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
    </div>
  );
}

/* ─── User role row ──────────────────────────────────────────────── */
function UserRoleRow({ u, currentUserId, onRoleChange }) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(u.role);
  const meta = ROLE_META[role] ?? ROLE_META.viewer;

  async function handleChange(newRole) {
    if (newRole === role) return;
    setLoading(true);
    try {
      await api.put(`/users/${u._id}`, { role: newRole });
      setRole(newRole);
      onRoleChange(u._id, newRole);
      toast.success(`${u.name}'s role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  }

  const isSelf = u._id === currentUserId;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="table-td">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              {u.name}
              {isSelf && <span className="text-xs text-indigo-500 font-normal">(you)</span>}
            </p>
            <p className="text-xs text-gray-400">{u.email}</p>
          </div>
        </div>
      </td>
      <td className="table-td text-sm text-gray-500">{u.department || '—'}</td>
      <td className="table-td">
        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>
      </td>
      <td className="table-td">
        {isSelf ? (
          <span className="text-xs text-gray-400 italic">Cannot change own role</span>
        ) : (
          <div className="relative inline-block">
            <select
              value={role}
              onChange={(e) => handleChange(e.target.value)}
              disabled={loading || !u.isActive}
              className="appearance-none pr-7 pl-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              {loading
                ? <Loader2 size={11} className="animate-spin text-gray-400" />
                : <ChevronDown size={11} className="text-gray-400" />
              }
            </div>
          </div>
        )}
      </td>
      <td className="table-td">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function Roles() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users?limit=200')
      .then((r) => setUsers(r.data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  function handleRoleChange(userId, newRole) {
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
  }

  // Count by role
  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r && u.isActive).length;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage who can do what across the system. Assign roles to users inline below.
        </p>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLES.map((r) => {
          const m = ROLE_META[r];
          const Icon = m.icon;
          return (
            <div key={r} className={`card p-5 flex items-center gap-4 border ${m.ring}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.bg} flex-shrink-0`}>
                <Icon size={20} className={m.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{counts[r]}</p>
                <p className={`text-sm font-medium ${m.color}`}>{m.label}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role descriptions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Role Descriptions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ROLES.map((r) => <RoleCard key={r} role={r} />)}
        </div>
      </div>

      {/* Permission matrix */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Permission Matrix</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">
                    Action
                  </th>
                  {ROLES.map((r) => {
                    const m = ROLE_META[r];
                    const Icon = m.icon;
                    return (
                      <th key={r} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-32">
                        <div className="flex items-center justify-center gap-1.5">
                          <Icon size={12} className={m.color} />
                          <span className={m.color}>{m.label}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((section) => (
                  <>
                    <tr key={section.label} className="bg-gray-50/70">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest"
                      >
                        {section.label}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-gray-700">{row.label}</td>
                        <Cell allowed={row.admin} />
                        <Cell allowed={row.manager} />
                        <Cell allowed={row.viewer} />
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User role assignments */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          <span className="flex items-center gap-2">
            <Users size={17} className="text-indigo-500" />
            Assign Roles to Users
          </span>
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">User</th>
                <th className="table-th">Department</th>
                <th className="table-th">Current Role</th>
                <th className="table-th">Change Role</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-10">
                    <Loader2 size={20} className="animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-10 text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <UserRoleRow
                    key={u._id}
                    u={u}
                    currentUserId={me?._id}
                    onRoleChange={handleRoleChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
