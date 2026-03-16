import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Eye, Pencil, Trash2,
  X, Loader2, ChevronLeft, ChevronRight, UserCheck, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AssetStatusBadge from '../components/AssetStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const CATEGORIES = ['laptop','desktop','monitor','server','networking','phone','tablet','printer','furniture','vehicle','software','other'];
const STATUSES   = ['active','inactive','maintenance','retired','lost'];

const EMPTY_FORM = {
  name: '', serialNo: '', category: '', status: 'active',
  assignedTo: '', locationId: '', purchaseDate: '', value: '',
  manufacturer: '', model: '', warrantyExpiry: '', notes: '',
};

function FieldRow({ label, children }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={wide ? 'max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0' : 'max-w-md'}>
        {wide ? (
          <>
            <DialogHeader className="px-6 py-4 border-b border-gray-100">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            {children}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssetForm({ form, setForm, users, locations, loading, onSubmit, onClose, isEdit }) {
  function set(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Name *">
          <Input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="MacBook Pro 16" />
        </FieldRow>
        <FieldRow label="Serial Number *">
          <Input required value={form.serialNo} onChange={(e) => set('serialNo', e.target.value)} placeholder="C02XG0..." />
        </FieldRow>
        <FieldRow label="Category *">
          <select className="input" required value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Status">
          <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Assigned To">
          <select className="input" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Location">
          <select className="input" value={form.locationId} onChange={(e) => set('locationId', e.target.value)}>
            <option value="">None</option>
            {locations.map((l) => <option key={l._id} value={l._id}>[{l.type}] {l.name}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Purchase Date">
          <Input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
        </FieldRow>
        <FieldRow label="Purchase Value ($)">
          <Input type="number" min="0" step="0.01" value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="0.00" />
        </FieldRow>
        <FieldRow label="Manufacturer">
          <Input value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="Apple" />
        </FieldRow>
        <FieldRow label="Model">
          <Input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="MacBook Pro M3 Max" />
        </FieldRow>
        <FieldRow label="Warranty Expiry">
          <Input type="date" value={form.warrantyExpiry} onChange={(e) => set('warrantyExpiry', e.target.value)} />
        </FieldRow>
      </div>
      <FieldRow label="Notes">
        <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional notes…" />
      </FieldRow>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
}

function BulkAssignModal({ open, onClose, selectedIds, users, onDone }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/assets/bulk-assign', { assetIds: selectedIds, userId: userId || null });
      toast.success(`${selectedIds.length} asset(s) updated`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk assign failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Bulk Assign — ${selectedIds.length} asset(s)`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose a user to assign all selected assets to, or leave blank to unassign them.
        </p>
        <FieldRow label="Assign To">
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Unassign —</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
        </FieldRow>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Apply
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Assets() {
  const { user, isManager } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [search, setSearch] = useState('');       // debounced — sent to API
  const [inputValue, setInputValue] = useState(''); // immediate — shown in input
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const [users, setUsers]     = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [addOpen, setAddOpen]   = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const searchTimer = useRef(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterLocation) params.locationId = filterLocation;
      const res = await api.get('/assets', { params });
      setAssets(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterCategory, filterLocation]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  useEffect(() => {
    if (!isManager) return;
    Promise.all([
      api.get('/users?limit=200').catch(() => ({ data: { data: [] } })),
      api.get('/locations?limit=500').catch(() => ({ data: { data: [] } })),
    ]).then(([u, l]) => {
      setUsers(u.data.data);
      setLocations(l.data.data);
    });
  }, [isManager]);

  function handleSearchChange(val) {
    setInputValue(val);                   // update input immediately (controlled)
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400); // debounce API call
  }

  function clearFilters() {
    setInputValue('');
    setSearch('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterLocation('');
    setPage(1);
  }

  function openAdd() { setForm(EMPTY_FORM); setAddOpen(true); }
  function openEdit(asset) {
    setEditAsset(asset);
    setForm({
      name: asset.name || '',
      serialNo: asset.serialNo || '',
      category: asset.category || '',
      status: asset.status || 'active',
      assignedTo: asset.assignedTo?._id || '',
      locationId: asset.locationId?._id || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
      value: asset.value ?? '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '',
      notes: asset.notes || '',
    });
    setEditOpen(true);
  }

  function buildPayload(f) {
    const p = { ...f };
    if (!p.assignedTo) p.assignedTo = null;
    if (!p.locationId) p.locationId = null;
    if (!p.purchaseDate) p.purchaseDate = null;
    if (!p.warrantyExpiry) p.warrantyExpiry = null;
    if (p.value === '') p.value = null;
    return p;
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/assets', buildPayload(form));
      toast.success('Asset created');
      setAddOpen(false);
      setPage(1);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create asset');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.put(`/assets/${editAsset._id}`, buildPayload(form));
      toast.success('Asset updated');
      setEditOpen(false);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update asset');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.delete(`/assets/${deleteId}`);
      toast.success('Asset deleted');
      setDeleteId(null);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete asset');
    } finally {
      setDeleteLoading(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelectedIds((prev) => prev.length === assets.length ? [] : assets.map((a) => a._id));
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total assets</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && isManager && (
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <UserCheck size={15} /> Assign {selectedIds.length} Selected
            </Button>
          )}
          {isManager ? (
            <Button onClick={openAdd}>
              <Plus size={15} /> Add Asset
            </Button>
          ) : (
            <div className="group relative">
              <Button disabled variant="outline" className="text-gray-400 cursor-not-allowed">
                <Lock size={14} /> Add Asset
              </Button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 hidden group-hover:block z-10 shadow-lg">
                You need <span className="text-amber-300 font-semibold">manager</span> or{' '}
                <span className="text-red-300 font-semibold">admin</span> role to create assets.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name or serial…"
              value={inputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <select className="input w-40" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="input w-44" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select className="input w-48" value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}>
            <option value="">All Locations</option>
            {locations.map((l) => <option key={l._id} value={l._id}>[{l.type}] {l.name}</option>)}
          </select>
          {(filterStatus || filterCategory || filterLocation || inputValue) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X size={14} /> Clear
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
                {isManager && (
                  <th className="table-th w-10">
                    <input
                      type="checkbox"
                      checked={assets.length > 0 && selectedIds.length === assets.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                )}
                <th className="table-th">Name / Serial</th>
                <th className="table-th">Category</th>
                <th className="table-th">Status</th>
                <th className="table-th">Assigned To</th>
                <th className="table-th">Location</th>
                <th className="table-th">Purchase Date</th>
                <th className="table-th w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={isManager ? 8 : 7} className="table-td text-center py-12">
                  <Loader2 size={20} className="animate-spin mx-auto text-primary" />
                </td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={isManager ? 8 : 7} className="table-td text-center py-12 text-muted-foreground">
                  No assets found
                </td></tr>
              ) : assets.map((asset) => (
                <tr key={asset._id} className="hover:bg-muted/30 transition-colors">
                  {isManager && (
                    <td className="table-td">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(asset._id)}
                        onChange={() => toggleSelect(asset._id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{asset.serialNo}</p>
                  </td>
                  <td className="table-td capitalize">{asset.category}</td>
                  <td className="table-td"><AssetStatusBadge status={asset.status} /></td>
                  <td className="table-td">
                    {asset.assignedTo ? (
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{asset.assignedTo.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.assignedTo.email}</p>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="table-td text-gray-600">
                    {asset.locationId ? asset.locationId.name : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="table-td text-muted-foreground text-xs">
                    {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/assets/${asset._id}`}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </Link>
                      {isManager && (
                        <button
                          onClick={() => openEdit(asset)}
                          className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteId(asset._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Asset" wide>
        <AssetForm form={form} setForm={setForm} users={users} locations={locations}
          loading={formLoading} onSubmit={handleAdd} onClose={() => setAddOpen(false)} isEdit={false} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Asset" wide>
        <AssetForm form={form} setForm={setForm} users={users} locations={locations}
          loading={formLoading} onSubmit={handleEdit} onClose={() => setEditOpen(false)} isEdit />
      </Modal>

      <BulkAssignModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        selectedIds={selectedIds}
        users={users}
        onDone={() => { setSelectedIds([]); fetchAssets(); }}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Asset">
        <p className="text-sm text-muted-foreground mb-6">
          This will permanently delete this asset and all its history. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
