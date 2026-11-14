import { apiFetch } from './api';

/** Official learner-facing support contact (display / mailto). SMTP From remains Phase 2. */
export const SUPPORT_EMAIL = 'support@onlineceunits.com';

export const SUPPORT_TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_ON_CUSTOMER',
  'RESOLVED',
  'CLOSED',
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];

export type SupportStaffReply = {
  message: string;
  at: string;
};

export type LearnerSupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  staffReplies: SupportStaffReply[];
};

export type LearnerSupportTicketList = {
  tickets: LearnerSupportTicket[];
};

export type CreateSupportTicketInput = {
  subject: string;
  message: string;
  priority: SupportTicketPriority;
};

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  WAITING_ON_CUSTOMER: 'Waiting on you',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
}

export function isSupportTicketPriority(value: string): value is SupportTicketPriority {
  return (SUPPORT_TICKET_PRIORITIES as readonly string[]).includes(value);
}

export function supportStatusLabel(status: string, audience: 'learner' | 'admin' = 'learner') {
  if (status === 'WAITING_ON_CUSTOMER') {
    return audience === 'admin' ? 'Waiting on student' : 'Waiting on you';
  }
  return isSupportTicketStatus(status) ? STATUS_LABELS[status] : status;
}

export function supportPriorityLabel(priority: string) {
  return isSupportTicketPriority(priority) ? PRIORITY_LABELS[priority] : priority;
}

export function isOpenSupportStatus(status: string) {
  return status === 'OPEN' || status === 'IN_PROGRESS';
}

export function isUrgentSupportPriority(priority: string) {
  return priority === 'HIGH' || priority === 'URGENT';
}

export function formatSupportTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  }).format(date);
}

export function validateSupportTicketDraft(input: {
  subject: string;
  message: string;
  priority: string;
}) {
  const subject = input.subject.trim();
  const message = input.message.trim();
  const errors: { subject?: string; message?: string; priority?: string } = {};

  if (!subject) errors.subject = 'Subject is required.';
  else if (subject.length < 3) errors.subject = 'Subject must be at least 3 characters.';
  else if (subject.length > 160) errors.subject = 'Subject must be 160 characters or fewer.';

  if (!message) errors.message = 'Message is required.';
  else if (message.length < 10) errors.message = 'Message must be at least 10 characters.';
  else if (message.length > 5000) errors.message = 'Message must be 5000 characters or fewer.';

  if (!isSupportTicketPriority(input.priority)) errors.priority = 'Choose a priority.';

  return {
    subject,
    message,
    priority: input.priority,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export async function listMySupportTickets() {
  return apiFetch<LearnerSupportTicketList>('/support/tickets');
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  return apiFetch<LearnerSupportTicket>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
