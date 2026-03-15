import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Package, Users, Wrench, Archive, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#ec4899','#64748b','#06b6d4','#84cc16','#a855f7'];

const ACTION_LABELS = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  assigned: 'Assigned',
  unassigned: 'Unassigned',
  status_changed: 'Status changed',
  location_changed: 'Location changed',
  bulk_assigned: 'Bulk assigned',
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, auditRes] = await Promise.allSettled([
          api.get('/assets/stats'),
          api.get('/audit?limit=8'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (auditRes.status === 'fulfilled') setRecentLogs(auditRes.value.data.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const byStatus = stats?.byStatus ?? {};
  const byCategory = stats?.byCategory ?? [];
  const byLocation = stats?.byLocation ?? [];

  const pieData = byCategory.filter((d) => d.value > 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Asset lifecycle overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Assets"
          value={stats?.total}
          icon={Package}
          color="bg-indigo-500"
        />
        <StatCard
          label="Active"
          value={byStatus.active ?? 0}
          icon={Activity}
          color="bg-emerald-500"
          sub="Currently in use"
        />
        <StatCard
          label="In Maintenance"
          value={byStatus.maintenance ?? 0}
          icon={Wrench}
          color="bg-amber-500"
          sub="Being serviced"
        />
        <StatCard
          label="Retired"
          value={byStatus.retired ?? 0}
          icon={Archive}
          color="bg-red-500"
          sub="End of life"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie — by category */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Assets by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">No asset data yet</div>
          )}
        </div>

        {/* Bar — by location */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Locations by Asset Count</h2>
          {byLocation.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byLocation} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">
              No location data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/audit" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log._id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity size={12} className="text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{log.performedByName || 'System'}</span>
                    {' '}
                    <span className="text-gray-500">{ACTION_LABELS[log.action] ?? log.action}</span>
                    {' '}
                    <Link
                      to={`/assets/${log.assetId?._id || log.assetId}`}
                      className="font-medium text-indigo-600 hover:text-indigo-700 truncate"
                    >
                      {log.assetName}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
