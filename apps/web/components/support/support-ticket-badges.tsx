import { Badge } from '@calace/ui/components/ui/badge';

import { supportPriorityLabel, supportStatusLabel } from '@/lib/support';

function statusVariant(status: string) {
  if (status === 'RESOLVED') return 'success' as const;
  if (status === 'OPEN') return 'warning' as const;
  if (status === 'CLOSED') return 'secondary' as const;
  if (status === 'IN_PROGRESS') return 'default' as const;
  return 'outline' as const;
}

export function SupportStatusBadge({
  status,
  audience,
}: {
  status: string;
  audience: 'learner' | 'admin';
}) {
  return <Badge variant={statusVariant(status)}>{supportStatusLabel(status, audience)}</Badge>;
}

export function SupportPriorityBadge({ priority }: { priority: string }) {
  if (priority === 'URGENT') {
    return (
      <Badge variant="outline" className="border-transparent bg-red-100 text-red-800">
        {supportPriorityLabel(priority)}
      </Badge>
    );
  }
  return (
    <Badge variant={priority === 'HIGH' ? 'warning' : priority === 'LOW' ? 'outline' : 'secondary'}>
      {supportPriorityLabel(priority)}
    </Badge>
  );
}
