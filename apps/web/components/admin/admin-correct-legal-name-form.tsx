'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { correctAdminLearnerName } from '@/lib/admin';
import type { AdminLearnerDetail } from '@/lib/admin';

const inputClass =
  'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700';

export function AdminCorrectLegalNameForm({
  learner,
}: {
  learner: Pick<AdminLearnerDetail, 'id' | 'firstName' | 'lastName' | 'certificates'>;
}) {
  const router = useRouter();
  const issuedCerts = learner.certificates.filter((c) => c.status === 'ISSUED');

  const [firstName, setFirstName] = useState(learner.firstName ?? '');
  const [lastName, setLastName] = useState(learner.lastName ?? '');
  const [reason, setReason] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  function toggleCert(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await correctAdminLearnerName(learner.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      reason: reason.trim(),
      idVerified,
      applyToCertificateIds: selectedIds.length > 0 ? selectedIds : undefined,
    });

    setSaving(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
      return;
    }

    const corrected = res.data?.certificatesCorrected ?? [];
    const skipped = res.data?.certificatesSkipped ?? [];
    const parts = [
      `User name updated to ${res.data?.user.firstName} ${res.data?.user.lastName}.`,
      corrected.length > 0
        ? `Updated ${corrected.length} issued certificate${corrected.length === 1 ? '' : 's'}: ${corrected.map((c) => c.certificateNo).join(', ')}.`
        : 'No issued certificates were updated.',
    ];
    if (skipped.length > 0) {
      parts.push(
        `Skipped ${skipped.length}: ${skipped.map((s) => `${s.id.slice(0, 8)}… (${s.reason})`).join('; ')}.`,
      );
    }

    setMessage({ type: 'success', text: parts.join(' ') });
    setReason('');
    router.refresh();
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-medium">Correct legal name</h2>
      <p className="mt-1 text-sm text-slate-600">
        Updates this learner&apos;s User first/last name (future certificates, transcript, and
        emails). Optionally also replaces the snapshotted name on selected <strong>issued</strong>{' '}
        certificates. This does not change completion status, CE hours, exam results, certificate
        number, or verification validity.
      </p>
      <p className="mt-2 text-sm text-amber-800">
        Verify a government ID offline before correcting. This form records an ID-verified flag
        only — it does not upload or store ID documents.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-800">First name</span>
            <input
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Last name</span>
            <input
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={80}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-slate-800">Reason (required)</span>
          <textarea
            className={inputClass}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            maxLength={500}
            placeholder="e.g. Typo on original registration; government ID matches corrected spelling"
          />
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={idVerified}
            onChange={(e) => setIdVerified(e.target.checked)}
          />
          <span>ID verified (government ID checked offline)</span>
        </label>

        {issuedCerts.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Also correct name on selected issued certificates
            </legend>
            <p className="text-xs text-slate-500">
              Leave unchecked to update the User record only. Revoked or archived certificates
              cannot be selected.
            </p>
            <ul className="space-y-2">
              {issuedCerts.map((cert) => (
                <li key={cert.id}>
                  <label className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedIds.includes(cert.id)}
                      onChange={() => toggleCert(cert.id)}
                    />
                    <span>
                      <span className="font-medium">{cert.certificateNo}</span>
                      <span className="block text-xs text-slate-500">
                        {cert.courseTitle} · current name:{' '}
                        {cert.learnerName?.trim() || '—'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : (
          <p className="text-sm text-slate-500">No issued certificates on file.</p>
        )}

        <Button type="submit" disabled={saving || !reason.trim()}>
          {saving ? 'Saving…' : 'Save name correction'}
        </Button>

        {message ? (
          <p
            className={
              message.type === 'error' ? 'text-sm text-red-700' : 'text-sm text-teal-800'
            }
          >
            {message.text}
          </p>
        ) : null}
      </form>
    </section>
  );
}
