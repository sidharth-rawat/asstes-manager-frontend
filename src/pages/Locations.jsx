import { useEffect, useState } from 'react';
import {
  Building2, Layers, Home, ChevronRight, ChevronDown,
  Plus, Pencil, Trash2, Loader2, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function buildTree(flat) {
  const map = {};
  flat.forEach((loc) => { map[loc._id] = { ...loc, children: [] }; });
  const roots = [];
  flat.forEach((loc) => {
    if (loc.parent) {
      const parentId = typeof loc.parent === 'object' ? loc.parent._id : loc.parent;
      if (map[parentId]) {
        map[parentId].children.push(map[loc._id]);
      } else {
        roots.push(map[loc._id]);
      }
    } else {
      roots.push(map[loc._id]);
    }
  });
  return roots;
}

const TYPE_ICONS = { building: Building2, floor: Layers, room: Home };
const TYPE_COLORS = {
  building: 'text-primary bg-primary/10',
  floor: 'text-amber-500 bg-amber-50',
  room: 'text-emerald-500 bg-emerald-50',
};
const VALID_CHILDREN = { building: ['floor'], floor: ['room'], room: [] };

function TypeBadge({ type }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[type] ?? 'text-gray-500 bg-gray-100'}`}>
      {type}
    </span>
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

function LocationForm({ form, setForm, allowedTypes, loading, onSubmit, onClose, isEdit }) {
  function set(field, val) { setForm((f) => ({ ...f, [field]: val })); }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="mb-1 block">Name *</Label>
        <Input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Building A" />
      </div>
      {!isEdit && (
        <div>
          <Label className="mb-1 block">Type *</Label>
          <select className="input" required value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="">Select type…</option>
            {allowedTypes.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      )}
      <div>
        <Label className="mb-1 block">Description</Label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional description…" />
      </div>
      {form.type === 'building' && !isEdit && (
        <>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Address (optional)</p>
          {['street','city','state','country','postalCode'].map((field) => (
            <div key={field}>
              <Label className="mb-1 block capitalize">{field}</Label>
              <Input value={form[field] || ''} onChange={(e) => set(field, e.target.value)} />
            </div>
          ))}
        </>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function LocationNode({ node, depth, onAdd, onEdit, onDelete, isManager }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const Icon = TYPE_ICONS[node.type] ?? MapPin;
  const hasChildren = node.children?.length > 0;
  const canAddChild = VALID_CHILDREN[node.type]?.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group transition-colors cursor-pointer ${
          depth === 0 ? 'bg-white border border-border mb-1' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="w-4 flex-shrink-0">
          {hasChildren ? (
            expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />
          ) : null}
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[node.type] ?? 'text-gray-400 bg-gray-100'}`}>
          <Icon size={13} />
        </div>
        <span className="text-sm font-medium text-gray-800 flex-1 truncate">{node.name}</span>
        <TypeBadge type={node.type} />
        {node.children?.length > 0 && (
          <span className="text-xs text-muted-foreground">{node.children.length} sub</span>
        )}
        {isManager && (
          <div className="hidden group-hover:flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            {canAddChild && (
              <button
                title={`Add ${VALID_CHILDREN[node.type][0]}`}
                onClick={() => onAdd(node)}
                className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              >
                <Plus size={13} />
              </button>
            )}
            <button
              onClick={() => onEdit(node)}
              className="p-1 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
      {expanded && node.children?.length > 0 && (
        <div>
          {node.children.map((child) => (
            <LocationNode key={child._id} node={child} depth={depth + 1}
              onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} isManager={isManager} />
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = { name: '', type: '', description: '', street: '', city: '', state: '', country: '', postalCode: '' };

export default function Locations() {
  const { isManager } = useAuth();
  const [locations, setLocations] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [addParent, setAddParent] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  async function fetchLocations() {
    setLoading(true);
    try {
      const res = await api.get('/locations?limit=500&isActive=true');
      setLocations(res.data.data);
      setTree(buildTree(res.data.data));
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLocations(); }, []);

  function openAdd(parentNode = null) {
    setAddParent(parentNode);
    const allowedTypes = parentNode ? VALID_CHILDREN[parentNode.type] : ['building'];
    setForm({ ...EMPTY_FORM, type: allowedTypes[0] || '' });
    setAddOpen(true);
  }

  function openEdit(node) {
    setEditTarget(node);
    setForm({ ...EMPTY_FORM, name: node.name || '', description: node.description || '', ...node.address });
    setEditOpen(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { name: form.name, type: form.type, description: form.description };
      if (addParent) payload.parent = addParent._id;
      if (form.type === 'building') {
        payload.address = { street: form.street, city: form.city, state: form.state, country: form.country, postalCode: form.postalCode };
      }
      await api.post('/locations', payload);
      toast.success('Location created');
      setAddOpen(false);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create location');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.put(`/locations/${editTarget._id}`, { name: form.name, description: form.description });
      toast.success('Location updated');
      setEditOpen(false);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update location');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.delete(`/locations/${deleteTarget._id}`);
      toast.success('Location deactivated');
      setDeleteTarget(null);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this location');
    } finally {
      setDeleteLoading(false);
    }
  }

  const allowedAddTypes = addParent ? VALID_CHILDREN[addParent.type] : ['building'];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">{locations.length} locations · building → floor → room</p>
        </div>
        {isManager && (
          <Button onClick={() => openAdd(null)}>
            <Plus size={15} /> Add Building
          </Button>
        )}
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No locations yet.</p>
            {isManager && (
              <Button onClick={() => openAdd(null)} className="mt-4">
                <Plus size={14} /> Add your first building
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <LocationNode key={node._id} node={node} depth={0}
                onAdd={openAdd} onEdit={openEdit} onDelete={setDeleteTarget} isManager={isManager} />
            ))}
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)}
        title={addParent ? `Add ${allowedAddTypes.join(' or ')} to "${addParent.name}"` : 'Add Building'}>
        <LocationForm form={form} setForm={setForm} allowedTypes={allowedAddTypes}
          loading={formLoading} onSubmit={handleAdd} onClose={() => setAddOpen(false)} isEdit={false} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit "${editTarget?.name}"`}>
        <LocationForm form={form} setForm={setForm} allowedTypes={[editTarget?.type].filter(Boolean)}
          loading={formLoading} onSubmit={handleEdit} onClose={() => setEditOpen(false)} isEdit />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Deactivate Location">
        <p className="text-sm text-muted-foreground mb-2">
          Deactivate <strong className="text-foreground">{deleteTarget?.name}</strong>?
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          This will fail if the location has active children or assigned assets.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading && <Loader2 size={14} className="animate-spin" />}
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
