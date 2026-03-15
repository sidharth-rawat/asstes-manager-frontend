import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, MapPin, Users, ClipboardList, LogOut, ChevronRight, Shield, Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
  { to: '/assets',    label: 'Assets',     icon: Package,         roles: ['admin', 'manager', 'viewer'] },
  { to: '/locations', label: 'Locations',  icon: MapPin,          roles: ['admin', 'manager', 'viewer'] },
  { to: '/users',     label: 'Users',      icon: Users,           roles: ['admin'] },
  { to: '/roles',     label: 'Roles & Perms', icon: Lock,         roles: ['admin'] },
  { to: '/audit',     label: 'Audit Log',  icon: ClipboardList,   roles: ['admin', 'manager'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Logged out');
    navigate('/login');
  }

  const links = NAV.filter((n) => n.roles.includes(user?.role));

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-slate-900 text-white z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield size={16} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">AssetTrack</p>
          <p className="text-xs text-slate-400">Lifecycle Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={13} className="text-indigo-300" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-700 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
