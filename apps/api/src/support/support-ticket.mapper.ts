import type { SupportTicketPriority, SupportTicketStatus } from '@calace/db';

export type SupportThreadEntry = {
  message: string;
  at: string;
  authorRole: 'learner' | 'staff';
};

export type SupportTicketRow = {
  id: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  thread: unknown;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
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
  staffReplies: { message: string; at: string }[];
};

export function parseThread(value: unknown): SupportThreadEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: SupportThreadEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.message !== 'string') continue;
    const message = record.message.trim();
    if (!message) continue;
    entries.push({
      message,
      at: typeof record.at === 'string' ? record.at : '',
      authorRole: record.authorRole === 'staff' ? 'staff' : 'learner',
    });
  }
  return entries;
}

export function appendStaffReply(thread: unknown, message: string, at: string): SupportThreadEntry[] {
  return [...parseThread(thread), { message, at, authorRole: 'staff' }];
}

export function toLearnerTicket(ticket: SupportTicketRow): LearnerSupportTicket {
  const staffReplies = parseThread(ticket.thread)
    .filter((entry) => entry.authorRole === 'staff')
    .map(({ message, at }) => ({ message, at }));

  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    staffReplies,
  };
}

export function toAdminTicket(ticket: SupportTicketRow & { user: { email: string } }) {
  return {
    ...toLearnerTicket(ticket),
    learnerEmail: ticket.user.email,
  };
}
