'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useState, type FormEvent } from 'react';

import { SupportPriorityBadge, SupportStatusBadge } from '@/components/support/support-ticket-badges';
import { updateAdminSupportTicket, type AdminSupport, type AdminSupportTicket } from '@/lib/admin';
import {
  formatSupportTimestamp,
  isOpenSupportStatus,
  isUrgentSupportPriority,
  SUPPORT_TICKET_STATUSES,
  supportStatusLabel,
  type SupportTicketStatus,
} from '@/lib/support';

const fieldClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 disabled:cursor-not-allowed disabled:opacity-60';

type Draft = { status: SupportTicketStatus; staffNote: string };
type Notice = { type: 'success' | 'error' | 'info'; text: string };

export function AdminSupportBoard({ initial }: { initial: AdminSupport }) {
  const [queue, setQueue] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      initial.recentTickets.map((ticket) => [
        ticket.id,
        { status: ticket.status, staffNote: '' },
      ]),
    ),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Record<string, Notice>>({});

  function updateDraft(ticketId: string, patch: Partial<Draft>, fallback: SupportTicketStatus) {
    setDrafts((current) => {
      const existing = current[ticketId] ?? { status: fallback, staffNote: '' };
      return { ...current, [ticketId]: { ...existing, ...patch } };
    });
  }

  async function save(ticket: AdminSupportTicket, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = drafts[ticket.id] ?? { status: ticket.status, staffNote: '' };
    const staffNote = draft.staffNote.trim();
    if (draft.status === ticket.status && !staffNote) {
      setNotices((current) => ({
        ...current,
        [ticket.id]: { type: 'info', text: 'Change the status or add a reply before saving.' },
      }));
      return;
    }

    setSavingId(ticket.id);
    setNotices((current) => {
      const next = { ...current };
      delete next[ticket.id];
      return next;
    });

    const result = await updateAdminSupportTicket(ticket.id, {
      status: draft.status,
      ...(staffNote ? { staffNote } : {}),
    });
    setSavingId(null);

    if (result.error || !result.data) {
      setNotices((current) => ({
        ...current,
        [ticket.id]: { type: 'error', text: result.error ?? 'Could not update this ticket.' },
      }));
      return;
    }

    const updated = result.data;
    setQueue((current) => applyTicketUpdate(current, ticket, updated));
    setDrafts((current) => ({
      ...current,
      [ticket.id]: { status: updated.status, staffNote: '' },
    }));
    setNotices((current) => ({
      ...current,
      [ticket.id]: {
        type: 'success',
        text: staffNote ? 'Reply sent and status saved.' : 'Ticket status saved.',
      },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Open / in progress</p>
          <p className="mt-2 text-3xl font-semibold">{queue.openTickets}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">High priority open</p>
          <p className="mt-2 text-3xl font-semibold">{queue.urgentOpenTickets}</p>
          <p className="mt-1 text-xs text-slate-500">
            Open or in-progress tickets marked high or urgent.
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium text-slate-900">Recent tickets</h2>
        {queue.recentTickets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No support tickets yet. Student submissions will appear here.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {queue.recentTickets.map((ticket) => {
              const draft = drafts[ticket.id] ?? { status: ticket.status, staffNote: '' };
              const notice = notices[ticket.id];
              const saving = savingId === ticket.id;
              return (
                <li key={ticket.id} className="py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-slate-900">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">
                        <a className="underline" href={`mailto:${ticket.learnerEmail}`}>
                          {ticket.learnerEmail}
                        </a>
                        {' · '}
                        Updated {formatSupportTimestamp(ticket.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SupportStatusBadge status={ticket.status} audience="admin" />
                      <SupportPriorityBadge priority={ticket.priority} />
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                    {ticket.message}
                  </p>
                  {ticket.staffReplies.length > 0 ? (
                    <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
                      {ticket.staffReplies.map((reply) => (
                        <div key={`${reply.at}-${reply.message}`} className="text-sm text-slate-700">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Staff reply
                          </p>
                          <p className="whitespace-pre-wrap break-words">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <form className="mt-3 space-y-3" onSubmit={(event) => void save(ticket, event)}>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr]">
                      <div className="space-y-1">
                        <label htmlFor={`status-${ticket.id}`} className="text-sm font-medium text-slate-800">
                          Status
                        </label>
                        <select
                          id={`status-${ticket.id}`}
                          className={fieldClass}
                          value={draft.status}
                          disabled={saving}
                          onChange={(event) =>
                            updateDraft(
                              ticket.id,
                              { status: event.target.value as SupportTicketStatus },
                              ticket.status,
                            )
                          }
                        >
                          {SUPPORT_TICKET_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {supportStatusLabel(status, 'admin')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`note-${ticket.id}`} className="text-sm font-medium text-slate-800">
                          Reply to student
                        </label>
                        <textarea
                          id={`note-${ticket.id}`}
                          className={`${fieldClass} min-h-20`}
                          maxLength={5000}
                          value={draft.staffNote}
                          disabled={saving}
                          placeholder="Optional note the student will see on their Support page"
                          onChange={(event) =>
                            updateDraft(ticket.id, { staffNote: event.target.value }, ticket.status)
                          }
                        />
                      </div>
                    </div>
                    {notice ? (
                      <p
                        role={notice.type === 'error' ? 'alert' : 'status'}
                        className={
                          notice.type === 'error'
                            ? 'text-sm text-red-700'
                            : notice.type === 'success'
                              ? 'text-sm text-emerald-700'
                              : 'text-sm text-slate-600'
                        }
                      >
                        {notice.text}
                      </p>
                    ) : null}
                    <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                      {saving ? 'Saving…' : 'Save ticket'}
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function applyTicketUpdate(
  queue: AdminSupport,
  previous: AdminSupportTicket,
  updated: AdminSupportTicket,
): AdminSupport {
  const wasOpen = isOpenSupportStatus(previous.status);
  const nowOpen = isOpenSupportStatus(updated.status);
  let openTickets = queue.openTickets;
  if (wasOpen && !nowOpen) openTickets -= 1;
  if (!wasOpen && nowOpen) openTickets += 1;

  const wasUrgent = wasOpen && isUrgentSupportPriority(previous.priority);
  const nowUrgent = nowOpen && isUrgentSupportPriority(updated.priority);
  let urgentOpenTickets = queue.urgentOpenTickets;
  if (wasUrgent && !nowUrgent) urgentOpenTickets -= 1;
  if (!wasUrgent && nowUrgent) urgentOpenTickets += 1;

  return {
    openTickets: Math.max(0, openTickets),
    urgentOpenTickets: Math.max(0, urgentOpenTickets),
    recentTickets: queue.recentTickets.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
  };
}
