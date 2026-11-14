'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useState } from 'react';

import { patchAdminComplianceSettings } from '@/lib/admin';
import type { ProviderComplianceSettings } from '@/lib/admin';

export function AdminComplianceSettingsForm({
  initial,
  internalNote,
}: {
  initial: ProviderComplianceSettings;
  internalNote: string;
}) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof ProviderComplianceSettings>(
    key: K,
    value: ProviderComplianceSettings[K],
  ) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await patchAdminComplianceSettings(settings);
    setSaving(false);
    if (res.error) {
      setMessage(res.error);
      return;
    }
    if (res.data?.settings) setSettings(res.data.settings);
    setMessage('Settings saved.');
  }

  const fields: Array<{
    key: keyof ProviderComplianceSettings;
    label: string;
    type?: 'text' | 'number' | 'checkbox' | 'textarea';
  }> = [
    { key: 'providerName', label: 'Provider name' },
    { key: 'nacProviderReference', label: 'Provider NAC reference (internal)' },
    { key: 'providerContactEmail', label: 'Provider contact email' },
    { key: 'providerContactPhone', label: 'Provider contact phone' },
    { key: 'providerContactAddress', label: 'Provider contact address' },
    { key: 'supportContactEmail', label: 'Support contact email' },
    { key: 'supportContactUrl', label: 'Support URL path' },
    { key: 'defaultInstructorName', label: 'Default instructor name' },
    { key: 'defaultCeHoursPerCourse', label: 'Default CE hours per course', type: 'number' },
    { key: 'minutesPerOnlineCeuHour', label: 'Active minutes per 1 CE hour', type: 'number' },
    { key: 'certificateWordingTemplate', label: 'Certificate hour wording ({{hours}})' },
    { key: 'attestationText', label: 'Learner attestation text', type: 'textarea' },
    { key: 'courseApprovalStatusLabel', label: 'Approval status label (when shown)' },
    {
      key: 'showApprovalStatusToLearners',
      label: 'Show approval status to learners',
      type: 'checkbox',
    },
    {
      // Gates all paid online CE checkout — off means learners cannot purchase.
      key: 'cdphOnlineApproved',
      label: 'CDPH online program approved (enables online checkout)',
      type: 'checkbox',
    },
    { key: 'recordRetentionPolicyText', label: 'Record retention policy (admin only)', type: 'textarea' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Configure learner-visible provider contact, certificate wording, seat-time rules, and
        instructor defaults. CDPH application packages and state audit exports stay internal — not
        exposed in the learner portal.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="font-medium text-slate-800">{field.label}</span>
            {field.type === 'checkbox' ? (
              <input
                type="checkbox"
                className="mt-2"
                checked={Boolean(settings[field.key])}
                onChange={(e) => update(field.key, e.target.checked as never)}
              />
            ) : field.type === 'textarea' ? (
              <textarea
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
                value={String(settings[field.key] ?? '')}
                onChange={(e) => update(field.key, e.target.value as never)}
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={String(settings[field.key] ?? '')}
                onChange={(e) =>
                  update(
                    field.key,
                    (field.type === 'number'
                      ? Number(e.target.value)
                      : e.target.value) as never,
                  )
                }
              />
            )}
          </label>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Internal audit architecture (not public)</p>
        <p className="mt-1">{internalNote}</p>
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Button type="button" disabled={saving} onClick={() => void handleSave()}>
        {saving ? 'Saving…' : 'Save compliance settings'}
      </Button>
    </div>
  );
}
