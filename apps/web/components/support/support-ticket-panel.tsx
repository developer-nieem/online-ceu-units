'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Input } from '@calace/ui/components/ui/input';
import { LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { SupportPriorityBadge, SupportStatusBadge } from '@/components/support/support-ticket-badges';
import {
  createSupportTicket,
  formatSupportTimestamp,
  isSupportTicketPriority,
  listMySupportTickets,
  SUPPORT_EMAIL,
  SUPPORT_TICKET_PRIORITIES,
  supportPriorityLabel,
  validateSupportTicketDraft,
  type LearnerSupportTicket,
  type SupportTicketPriority,
} from '@/lib/support';

const fieldClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-60';

export function SupportTicketPanel({
  signedIn,
  initialTickets,
  loadFailed,
}: {
  signedIn: boolean;
  initialTickets: LearnerSupportTicket[];
  loadFailed: boolean;
}) {
  const formId = useId();
  const subjectRef = useRef<HTMLInputElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<SupportTicketPriority>('MEDIUM');
  const [fieldErrors, setFieldErrors] = useState<{
    subject?: string;
    message?: string;
    priority?: string;
  }>({});
  const [tickets, setTickets] = useState(initialTickets);
  const [listError, setListError] = useState<string | null>(
    loadFailed ? 'Could not load your support tickets.' : null,
  );
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (formOpen) subjectRef.current?.focus();
  }, [formOpen]);

  async function reloadTickets() {
    setLoadingList(true);
    setListError(null);
    const result = await listMySupportTickets();
    setLoadingList(false);
    if (result.error || !result.data) {
      setListError(result.error ?? 'Could not load your support tickets.');
      return;
    }
    setTickets(result.data.tickets);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validated = validateSupportTicketDraft({ subject, message, priority });
    setFieldErrors(validated.errors);
    if (!validated.valid || !isSupportTicketPriority(validated.priority)) return;

    setSubmitting(true);
    setBanner(null);
    const result = await createSupportTicket({
      subject: validated.subject,
      message: validated.message,
      priority: validated.priority,
    });
    setSubmitting(false);

    if (result.status === 401) {
      setBanner({
        type: 'error',
        text: 'Your session expired. Sign in again to submit a ticket.',
      });
      return;
    }
    if (result.error || !result.data) {
      setBanner({ type: 'error', text: result.error ?? 'Could not submit your support ticket.' });
      return;
    }

    const created = result.data;
    setTickets((current) => [created, ...current.filter((ticket) => ticket.id !== created.id)]);
    setSubject('');
    setMessage('');
    setPriority('MEDIUM');
    setFieldErrors({});
    setFormOpen(false);
    setBanner({ type: 'success', text: 'Your support ticket was submitted.' });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-teal-700" aria-hidden />
          <CardTitle className="text-base">Support tickets</CardTitle>
        </div>
        <CardDescription>
          Send a question about your account, courses, certificates, or California renewal. Tickets
          you submit, and any replies, stay on this page. You can also email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-teal-800 underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!signedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Sign in to open a ticket and see its status.</p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/login?next=/support">Open a support ticket</Link>
            </Button>
          </div>
        ) : (
          <>
            {banner ? (
              <p
                role={banner.type === 'error' ? 'alert' : 'status'}
                className={
                  banner.type === 'error'
                    ? 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'
                    : 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
                }
              >
                {banner.text}{' '}
                {banner.text.includes('Sign in') ? (
                  <Link href="/login?next=/support" className="font-medium underline">
                    Sign in
                  </Link>
                ) : null}
              </p>
            ) : null}

            {formOpen ? (
              <form noValidate className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor={`${formId}-subject`} className="text-sm font-medium text-slate-800">
                      Subject
                    </label>
                    <Input
                      ref={subjectRef}
                      id={`${formId}-subject`}
                      value={subject}
                      maxLength={160}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.subject)}
                      aria-describedby={fieldErrors.subject ? `${formId}-subject-error` : undefined}
                      onChange={(event) => {
                        setSubject(event.target.value);
                        setFieldErrors((current) => ({ ...current, subject: undefined }));
                      }}
                    />
                    {fieldErrors.subject ? (
                      <p id={`${formId}-subject-error`} className="text-sm text-red-700">
                        {fieldErrors.subject}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`${formId}-priority`} className="text-sm font-medium text-slate-800">
                      Priority
                    </label>
                    <select
                      id={`${formId}-priority`}
                      className={fieldClass}
                      value={priority}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.priority)}
                      aria-describedby={fieldErrors.priority ? `${formId}-priority-error` : undefined}
                      onChange={(event) => {
                        if (isSupportTicketPriority(event.target.value)) setPriority(event.target.value);
                        setFieldErrors((current) => ({ ...current, priority: undefined }));
                      }}
                    >
                      {SUPPORT_TICKET_PRIORITIES.map((option) => (
                        <option key={option} value={option}>
                          {supportPriorityLabel(option)}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.priority ? (
                      <p id={`${formId}-priority-error`} className="text-sm text-red-700">
                        {fieldErrors.priority}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${formId}-message`} className="text-sm font-medium text-slate-800">
                    Message
                  </label>
                  <textarea
                    id={`${formId}-message`}
                    className={`${fieldClass} min-h-32`}
                    value={message}
                    maxLength={5000}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? `${formId}-message-error` : undefined}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setFieldErrors((current) => ({ ...current, message: undefined }));
                    }}
                  />
                  {fieldErrors.message ? (
                    <p id={`${formId}-message-error`} className="text-sm text-red-700">
                      {fieldErrors.message}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">At least 10 characters.</p>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={submitting}
                    onClick={() => setFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Submit ticket'}
                  </Button>
                </div>
              </form>
            ) : (
              <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
                Open a support ticket
              </Button>
            )}

            <section aria-live="polite" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Your tickets</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loadingList}
                  onClick={() => void reloadTickets()}
                >
                  {loadingList ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
              {listError ? (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {listError}
                </p>
              ) : null}
              {tickets.length === 0 && !listError ? (
                <p className="text-sm text-slate-600">You have not submitted a support ticket yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border border-slate-200">
                  {tickets.map((ticket) => (
                    <li key={ticket.id} className="space-y-2 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="break-words font-medium text-slate-900">{ticket.subject}</p>
                        <div className="flex flex-wrap gap-2">
                          <SupportStatusBadge status={ticket.status} audience="learner" />
                          <SupportPriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{ticket.message}</p>
                      <p className="text-xs text-slate-500">
                        Submitted {formatSupportTimestamp(ticket.createdAt)}
                        {ticket.updatedAt !== ticket.createdAt
                          ? ` · Updated ${formatSupportTimestamp(ticket.updatedAt)}`
                          : ''}
                      </p>
                      {ticket.staffReplies.length > 0 ? (
                        <div className="space-y-2 rounded-md bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Support replies
                          </p>
                          {ticket.staffReplies.map((reply) => (
                            <div key={`${reply.at}-${reply.message}`} className="text-sm text-slate-700">
                              <p className="whitespace-pre-wrap break-words">{reply.message}</p>
                              {reply.at ? (
                                <p className="mt-1 text-xs text-slate-500">{formatSupportTimestamp(reply.at)}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
