'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { useEffect, useState } from 'react';

import { CeuDeadlineCalculator } from '@/components/account/ceu-deadline-calculator';
import { CaliforniaRenewalProgressCard } from '@/components/renewal/california-renewal-progress-card';
import { RenewalComplianceDisclaimer } from '@/components/renewal/renewal-compliance-disclaimer';
import {
  getAccountProfile,
  updateAccountProfile,
  type AccountProfileEditable,
  type AccountProfileResponse,
} from '@/lib/account';
import { SUPPORT_EMAIL } from '@/lib/support';

const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Phoenix', label: 'Arizona (Phoenix)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (Honolulu)' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

function formatMemberSince(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function applyProfile(
  data: AccountProfileResponse,
  setProfile: (p: AccountProfileResponse) => void,
  setForm: (f: AccountProfileEditable) => void,
  setCityConsent: (v: boolean) => void,
  setCity: (v: string) => void,
) {
  setProfile(data);
  setForm(data.editable);
  setCityConsent(data.editable.cityConsentGiven ?? true);
  setCity(data.editable.city ?? '');
}

export function LearnerProfileForm({
  initialProfile = null,
}: {
  initialProfile?: AccountProfileResponse | null;
}) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>(
    initialProfile ? 'ready' : 'loading',
  );
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<AccountProfileResponse | null>(initialProfile);
  const [form, setForm] = useState<AccountProfileEditable | null>(
    initialProfile?.editable ?? null,
  );
  const [cityConsent, setCityConsent] = useState(
    initialProfile?.editable.cityConsentGiven ?? true,
  );
  const [city, setCity] = useState(initialProfile?.editable.city ?? '');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (initialProfile) return;
    let cancelled = false;
    getAccountProfile().then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setLoadError(result.error ?? 'Could not load your account profile.');
        setStatus('error');
        return;
      }
      applyProfile(result.data, setProfile, setForm, setCityConsent, setCity);
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [initialProfile]);

  const setField = <K extends keyof AccountProfileEditable>(
    key: K,
    value: AccountProfileEditable[K],
  ) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
    setMessage(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== undefined),
    ) as Partial<AccountProfileEditable>;

    if (cityConsent) {
      payload.city = city.trim() || null;
      payload.cityConsentGiven = true;
    } else {
      payload.city = null;
      payload.cityConsentGiven = false;
    }

    const result = await updateAccountProfile(payload);
    setSaving(false);
    if (result.error || !result.data) {
      setMessage({ type: 'error', text: result.error ?? 'Could not save your profile.' });
      return;
    }
    setProfile(result.data);
    setForm(result.data.editable);
    setCityConsent(result.data.editable.cityConsentGiven ?? true);
    setCity(result.data.editable.city ?? '');
    setMessage({ type: 'success', text: 'Your profile has been saved.' });
  };

  if (status === 'loading') {
    return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
  }

  if (status === 'error' || !form || !profile) {
    return (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">Unable to load your profile.</p>
        {loadError ? <p>{loadError}</p> : null}
        <p>
          Sign in again, refresh the page, or contact{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="mt-1 text-sm text-slate-900">{profile.readOnly.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member since
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {formatMemberSince(profile.readOnly.memberSince)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Completed CE hours
            </p>
            <p className="mt-1 text-sm text-slate-900">{profile.readOnly.completedCeHours}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Certificates earned
            </p>
            <p className="mt-1 text-sm text-slate-900">{profile.readOnly.certificatesEarned}</p>
          </div>
        </CardContent>
      </Card>

      <CeuDeadlineCalculator
        initialEffectiveDate={form.cnaEffectiveDate}
        initialExpirationDate={form.cnaRenewalDueDate}
      />

      <CaliforniaRenewalProgressCard progress={profile.renewalProgress} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update how we address you and store your CNA renewal details for certificates and
            compliance records.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">First name</span>
            <input
              className={inputClass}
              value={form.firstName ?? ''}
              onChange={(e) => setField('firstName', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">Last name</span>
            <input
              className={inputClass}
              value={form.lastName ?? ''}
              onChange={(e) => setField('lastName', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-800">Preferred display name</span>
            <input
              className={inputClass}
              placeholder="How your name appears on certificates"
              value={form.preferredDisplayName ?? ''}
              onChange={(e) => setField('preferredDisplayName', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">CNA certificate number</span>
            <span className="block text-xs text-muted-foreground">
              Add your CNA License Number so it appears on your certificates.
            </span>
            <input
              className={inputClass}
              maxLength={64}
              value={form.cnaLicenseNumber ?? ''}
              onChange={(e) => setField('cnaLicenseNumber', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">Issuing state</span>
            <input
              className={inputClass}
              placeholder="CA"
              maxLength={32}
              value={form.cnaIssuingState ?? ''}
              onChange={(e) => setField('cnaIssuingState', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">CNA certificate effective date</span>
            <span className="block text-xs text-muted-foreground">
              The date your current certification period started (from your CNA card).
            </span>
            <input
              className={inputClass}
              type="date"
              value={form.cnaEffectiveDate ?? ''}
              onChange={(e) => setField('cnaEffectiveDate', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">Renewal due date</span>
            <span className="block text-xs text-muted-foreground">
              Enter your most recent (active) certification. Renewal progress is calculated from
              this date.
            </span>
            <p className="text-xs text-slate-500 mt-1">
              <a
                href="https://cvl.cdph.ca.gov/SearchPage.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline"
              >
                Look up your current dates on CDPH →
              </a>
            </p>
            <input
              className={inputClass}
              type="date"
              value={form.cnaRenewalDueDate ?? ''}
              onChange={(e) => setField('cnaRenewalDueDate', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">Birth Month</span>
            <select
              className={inputClass}
              value={form.birthMonth ?? ''}
              onChange={(e) =>
                setField('birthMonth', e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— select month —</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">Birth Day (no year stored)</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 15"
              value={form.birthDay ?? ''}
              onChange={(e) =>
                setField('birthDay', e.target.value ? Number(e.target.value) : null)
              }
            />
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Used for renewal deadline tracking only. Birth year is never stored.
          </p>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">Timezone</span>
            <select
              className={inputClass}
              value={form.timezone ?? 'America/Los_Angeles'}
              onChange={(e) => setField('timezone', e.target.value)}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">HHA tracking (optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            HHA tracking is informational only. Current California HHA renewal rules may differ from
            CNA online CE rules. Learners should confirm current requirements directly with CDPH.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-800">HHA certificate number</span>
            <input
              className={inputClass}
              value={form.hhaCertificateNumber ?? ''}
              onChange={(e) => setField('hhaCertificateNumber', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">HHA effective date</span>
            <input
              className={inputClass}
              type="date"
              value={form.hhaEffectiveDate ?? ''}
              onChange={(e) => setField('hhaEffectiveDate', e.target.value || null)}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-800">HHA expiration date</span>
            <input
              className={inputClass}
              type="date"
              value={form.hhaExpirationDate ?? ''}
              onChange={(e) => setField('hhaExpirationDate', e.target.value || null)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regional insights (optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Share your city to help CAL ACE understand regional CNA learning trends.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">City (optional)</span>
            <input
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
              placeholder="e.g. San Jose, Milpitas, Sacramento"
              maxLength={100}
              value={city}
              disabled={!cityConsent}
              onChange={(e) => {
                setCity(e.target.value);
                setMessage(null);
              }}
            />
            <span className="block text-xs text-muted-foreground">
              Used to show regional CNA learning trends — never shared with third parties.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              checked={cityConsent}
              onChange={(e) => {
                const checked = e.target.checked;
                setCityConsent(checked);
                if (!checked) setCity('');
                setMessage(null);
              }}
            />
            <span className="text-slate-700">
              I consent to CAL ACE using my city for regional analytics and learner insights. I can
              withdraw this consent at any time by unchecking this box.
            </span>
          </label>
        </CardContent>
      </Card>

      <RenewalComplianceDisclaimer />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
        {message ? (
          <p
            className={`text-sm ${message.type === 'success' ? 'text-teal-800' : 'text-red-700'}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
