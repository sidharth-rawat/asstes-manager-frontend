import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, User, Calendar, DollarSign,
  Shield, Tag, Cpu, FileText, Clock, CheckCircle2,
  XCircle, AlertTriangle, Pencil, Trash2, Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AssetStatusBadge from '../components/AssetStatusBadge';
import { Button } from '@/components/ui/button';

const ACTION_COLORS = {
  created:         'bg-emerald-100 text-emerald-600',
  updated:         'bg-blue-100   text-blue-600',
  deleted:         'bg-red-100    text-red-600',
  assigned:        'bg-indigo-100 text-indigo-600',
  unassigned:      'bg-gray-100   text-gray-500',
  status_changed:  'bg-amber-100  text-amber-600',
  location_changed:'bg-cyan-100   text-cyan-600',
  bulk_assigned:   'bg-purple-100 text-purple-600',
};

const ACTION_LABELS = {
  created: 'Created', updated: 'Updated', deleted: 'Deleted',
  assigned: 'Assigned', unassigned: 'Unassigned',
  status_changed: 'Status changed', location_changed: 'Location changed',
  bulk_assigned: 'Bulk assigned',
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

function AuditEntry({ log }) {
  const colorClass = ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-500';
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Clock size={13} />
        </div>
        <div className="w-px flex-1 bg-gray-100 my-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
            {ACTION_LABELS[log.action] ?? log.action}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0" title={log.createdAt}>
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1.5">
          <span className="font-medium">{log.performedByName || 'System'}</span>
          {log.performedByEmail && <span className="text-muted-foreground"> ({log.performedByEmail})</span>}
        </p>
        {(log.fromValue || log.toValue) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
            {log.fromValue && (
              <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded">
                <XCircle size={10} /> {log.fromValue}
              </span>
            )}
            {log.fromValue && log.toValue && <span>→</span>}
            {log.toValue && (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                <CheckCircle2 size={10} /> {log.toValue}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm')}
        </p>
      </div>
    </div>
  );
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [asset, setAsset] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [assetRes, auditRes] = await Promise.all([
          api.get(`/assets/${id}`),
          api.get(`/audit/asset/${id}?limit=50`),
        ]);
        setAsset(assetRes.data.data);
        setAuditLogs(auditRes.data.data);
      } catch (err) {
        toast.error(err.response?.status === 404 ? 'Asset not found' : 'Failed to load asset');
        navigate('/assets');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  async function handleDelete() {
    if (!window.confirm('Permanently delete this asset? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      navigate('/assets');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!asset) return null;

  const isWarrantyExpired = asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date();
  const isWarrantyExpiringSoon =
    asset.warrantyExpiry &&
    !isWarrantyExpired &&
    new Date(asset.warrantyExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> Back to Assets
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {asset.serialNo}
                </span>
                <AssetStatusBadge status={asset.status} size="lg" />
                <span className="text-sm text-muted-foreground capitalize">{asset.category}</span>
              </div>
            </div>
          </div>
          {isManager && (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to={`/assets/${id}`}>
                  <Pencil size={14} /> Edit
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Warranty warning */}
      {(isWarrantyExpired || isWarrantyExpiringSoon) && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          isWarrantyExpired
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <AlertTriangle size={16} />
          <p className="text-sm font-medium">
            {isWarrantyExpired
              ? `Warranty expired ${formatDistanceToNow(new Date(asset.warrantyExpiry), { addSuffix: true })}`
              : `Warranty expires ${formatDistanceToNow(new Date(asset.warrantyExpiry), { addSuffix: true })}`
            }
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Asset Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <InfoRow icon={Tag} label="Serial Number" value={asset.serialNo} />
                <InfoRow icon={Cpu} label="Manufacturer" value={asset.manufacturer} />
                <InfoRow icon={Cpu} label="Model" value={asset.model} />
                <InfoRow icon={Calendar} label="Purchase Date"
                  value={asset.purchaseDate ? format(new Date(asset.purchaseDate), 'dd MMM yyyy') : null}
                />
              </div>
              <div>
                <InfoRow icon={DollarSign} label="Purchase Value"
                  value={asset.value != null ? `$${Number(asset.value).toLocaleString()}` : null}
                />
                <InfoRow icon={Shield} label="Warranty Expiry"
                  value={asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), 'dd MMM yyyy') : null}
                />
                <InfoRow icon={MapPin} label="Location" value={asset.locationId?.name} />
                <InfoRow icon={Calendar} label="Added"
                  value={asset.createdAt && !isNaN(new Date(asset.createdAt)) ? format(new Date(asset.createdAt), 'dd MMM yyyy') : '—'}
                />
              </div>
            </div>
            {asset.notes && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{asset.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {asset.assignmentHistory?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Assignment History</h2>
              <div className="space-y-3">
                {asset.assignmentHistory.slice().reverse().map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{entry.user?.name || 'Unknown user'}</span>
                      <span className="text-muted-foreground ml-2">
                        from {format(new Date(entry.assignedAt), 'dd MMM yyyy')}
                        {entry.unassignedAt
                          ? ` to ${format(new Date(entry.unassignedAt), 'dd MMM yyyy')}`
                          : ' (current)'}
                      </span>
                    </div>
                    {!entry.unassignedAt && (
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Current Assignment</h2>
            {asset.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {asset.assignedTo.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{asset.assignedTo.name}</p>
                  <p className="text-xs text-muted-foreground">{asset.assignedTo.email}</p>
                  {asset.assignedTo.department && (
                    <p className="text-xs text-muted-foreground">{asset.assignedTo.department}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not assigned to anyone</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Audit Trail
              <span className="ml-2 text-xs text-muted-foreground font-normal">({auditLogs.length} events)</span>
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No audit history yet</p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto -mr-2 pr-2">
                {auditLogs.map((log) => (
                  <AuditEntry key={log._id} log={log} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
