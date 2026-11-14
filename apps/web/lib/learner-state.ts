export type LearnerCourseState =

  | 'not_enrolled'

  | 'enrolled'

  | 'in_progress'

  | 'completed'

  | 'requires_reset';



export const LEARNER_STATE_LABELS: Record<LearnerCourseState, string> = {

  not_enrolled: 'Not enrolled',

  enrolled: 'Enrolled',

  in_progress: 'In progress',

  completed: 'Completed',

  requires_reset: 'Restart required',

};



/** Map legacy API values to current learner state. */

export function normalizeLearnerState(state: string): LearnerCourseState {

  if (state === 'requires_repurchase') return 'requires_reset';

  if (state in LEARNER_STATE_LABELS) return state as LearnerCourseState;

  return 'not_enrolled';

}


