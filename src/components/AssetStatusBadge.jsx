import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active:      { label: 'Active',      variant: 'success' },
  inactive:    { label: 'Inactive',    variant: 'muted' },
  maintenance: { label: 'Maintenance', variant: 'warning' },
  retired:     { label: 'Retired',     variant: 'danger' },
  lost:        { label: 'Lost',        variant: 'danger' },
};

export default function AssetStatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_STYLES[status] ?? { label: status, variant: 'muted' };
  return (
    <Badge
      variant={cfg.variant}
      className={cn(size === 'lg' && 'px-3 py-1 text-sm rounded-full')}
    >
      {cfg.label}
    </Badge>
  );
}
