import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Search, ChevronLeft, ChevronRight, Loader2, X,
} from 'lucide-react';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const safeFormat = (val, fmt) => {
  const d = new Date(val);
  return isValid(d) ? format(d, fmt) : '—';
};
const safeDistance = (val) => {
  const d = new Date(val);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
};

const ACTIONS = ['created','updated','deleted','assigned','unassigned','status_changed','location_changed','bulk_assigned'];

const ACTION_BADGE = {
  created:          { label: 'Created',          variant: 'success' },
  updated:          { label: 'Updated',          variant: 'default' },
  deleted:          { label: 'Deleted',          variant: 'danger' },
  assigned:         { label: 'Assigned',         variant: 'default' },
  unassigned:       { label: 'Unassigned',       variant: 'muted' },
  status_changed:   { label: 'Status Changed',   variant: 'warning' },
  location_changed: { label: 'Location Changed', variant: 'muted' },
  bulk_assigned:    { label: 'Bulk Assigned',    variant: 'default' },
};

function ActionBadge({ action }) {
  const cfg = ACTION_BADGE[action] ?? { label: action, variant: 'muted' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 25;

  const [filterAction, setFilterAction] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [users, setUsers] = useState([]);
  const [filterUser, setFilterUser] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterAction) params.action = filterAction;
      if (filterUser) params.performedBy = filterUser;
      if (filterAsset && filterAsset.match(/^[a-f\d]{24}$/i)) {
        params.assetId = filterAsset;
      }
      const res = await api.get('/audit', { params });
      setLogs(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterUser, filterAsset]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    api.get('/users?limit=200').then((r) => setUsers(r.data.data)).catch(() => {});
  }, []);

  function clearFilters() {
    setFilterAction('');
    setFilterAsset('');
    setFilterUser('');
    setPage(1);
  }

  const pages = Math.ceil(total / LIMIT);
  const hasFilters = filterAction || filterAsset || filterUser;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} events recorded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-48" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_BADGE[a]?.label ?? a}</option>
            ))}
          </select>
          <select className="input w-48" value={filterUser} onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}>
            <option value="">All Users</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X size={14} /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Timestamp</th>
                <th className="table-th">Action</th>
                <th className="table-th">Asset</th>
                <th className="table-th">Performed By</th>
                <th className="table-th">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-12">
                    <Loader2 size={20} className="animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-12">
                    <ClipboardList size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No audit events found</p>
                  </td>
                </tr>
              ) : logs.map((log) => {
                const assetId = typeof log.assetId === 'object' ? log.assetId?._id : log.assetId;
                return (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="table-td whitespace-nowrap">
                      <p className="text-sm text-gray-800">{safeFormat(log.createdAt, 'dd MMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {safeFormat(log.createdAt, 'HH:mm:ss')}
                        <span className="ml-1 text-muted-foreground/50">·</span>
                        <span className="ml-1">{safeDistance(log.createdAt)}</span>
                      </p>
                    </td>
                    <td className="table-td">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="table-td">
                      {assetId ? (
                        <Link to={`/assets/${assetId}`} className="text-sm font-medium text-primary hover:text-primary/80">
                          {log.assetName}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">{log.assetName}</span>
                      )}
                      {log.assetSerialNo && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{log.assetSerialNo}</p>
                      )}
                    </td>
                    <td className="table-td">
                      <p className="text-sm font-medium text-gray-800">{log.performedByName || 'System'}</p>
                      {log.performedByEmail && (
                        <p className="text-xs text-muted-foreground">{log.performedByEmail}</p>
                      )}
                    </td>
                    <td className="table-td">
                      {log.fromValue || log.toValue ? (
                        <div className="flex items-center gap-2 text-xs">
                          {log.fromValue && (
                            <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded max-w-[100px] truncate" title={log.fromValue}>
                              {log.fromValue}
                            </span>
                          )}
                          {log.fromValue && log.toValue && <span className="text-muted-foreground">→</span>}
                          {log.toValue && (
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded max-w-[100px] truncate" title={log.toValue}>
                              {log.toValue}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-8 w-8">
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm px-3">{page} / {pages}</span>
              <Button variant="outline" size="icon" disabled={page === pages} onClick={() => setPage(page + 1)} className="h-8 w-8">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
