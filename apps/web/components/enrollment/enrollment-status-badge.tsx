import { Badge } from '@calace/ui/components/ui/badge';

import { LEARNER_STATE_LABELS, type LearnerCourseState } from '@/lib/learner-state';

const VARIANT: Record<
  LearnerCourseState,
  'default' | 'secondary' | 'outline' | 'success' | 'warning'
> = {
  not_enrolled: 'outline',
  enrolled: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  requires_reset: 'warning',
};

export function EnrollmentStatusBadge({ state }: { state: LearnerCourseState }) {
  return <Badge variant={VARIANT[state]}>{LEARNER_STATE_LABELS[state]}</Badge>;
}
