'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

import { Button } from '@calace/ui/components/ui/button';
import { PasswordInput } from '@calace/ui/components/ui/password-input';
import { sanitizeNextPath } from '@/lib/auth/learner';
import { buildCheckoutPath } from '@/lib/checkout-path';
import type { PurchasePlanId } from '@/lib/pricing';
import {
  DEFAULT_CERTIFICATE_LOGO_SRC,
  DEFAULT_INSTITUTION_LEGAL_NAME,
} from '@calace/ui/components/certificate';
import { TENANT_PROVIDER_BRAND_LINE } from '@/lib/brand';
import { CaptchaField, type CaptchaFieldHandle } from '@/components/auth/captcha-field';

type SignupFormProps = {
  pendingPlan?: PurchasePlanId;
  referredByCode?: string;
  /** Post-signup path (login convention). Ignored when pendingPlan sends user to checkout. */
  nextPath?: string;
};

function ReferralInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="What is a referral code?"
        aria-expanded={open}
        aria-controls="referral-info-popover"
        onClick={() => setOpen((o) => !o)}
        className="flex size-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
      >
        <Info aria-hidden className="size-4" strokeWidth={2} />
      </button>
      {open ? (
        <span
          id="referral-info-popover"
          role="note"
          className="absolute left-1/2 top-6 z-20 w-64 max-w-[16rem] -translate-x-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-relaxed text-slate-600 shadow-lg"
        >
          Referral code you received from a friend. It starts with CAL followed by 5 digits (e.g.
          CAL12345). Enter it to get an additional $5 savings.
        </span>
      ) : null}
    </span>
  );
}

export function SignupForm({ pendingPlan, referredByCode, nextPath }: SignupFormProps) {
  const router = useRouter();
  const captchaRef = React.useRef<CaptchaFieldHandle>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [cityConsent, setCityConsent] = React.useState(true);
  const [city, setCity] = React.useState('');
  const [manualReferralCode, setManualReferralCode] = React.useState('');
  const [showReferralInput, setShowReferralInput] = React.useState(false);

  const effectiveReferralCode =
    (referredByCode ?? manualReferralCode.trim().toUpperCase()) || undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const cnaLicenseNumber = String(data.get('cnaLicenseNumber') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (!firstName || !lastName) {
      setError('Please enter your legal first and last name.');
      return;
    }
    if (!cnaLicenseNumber) {
      setError('Please enter your CNA License Number.');
      return;
    }
    if (cnaLicenseNumber.length > 64) {
      setError('CNA License Number must be 64 characters or fewer.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!consent) {
      setError('Please agree to the terms and privacy notice to continue.');
      return;
    }

    setLoading(true);
    try {
      const captchaToken = await captchaRef.current?.getToken();
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          cnaLicenseNumber,
          email,
          password,
          termsAccepted: true,
          city: cityConsent ? city.trim() || null : null,
          cityConsentGiven: cityConsent,
          ...(effectiveReferralCode ? { referredByCode: effectiveReferralCode } : {}),
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? 'Unable to create your account. Please try again.');
        return;
      }

      if (pendingPlan === 'unlimited-1y' || pendingPlan === 'unlimited-2y') {
        router.push(buildCheckoutPath(pendingPlan));
        router.refresh();
        return;
      }

      router.push(sanitizeNextPath(nextPath));
      router.refresh();
    } catch {
      setError('Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <img
          alt="CAL ACE Nursing Academy logo"
          className="mx-auto mb-4 h-12 w-auto object-contain"
          src={DEFAULT_CERTIFICATE_LOGO_SRC}
        />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {DEFAULT_INSTITUTION_LEGAL_NAME}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your legal name is printed on your certificates and cannot be changed later, so please
          enter it exactly as it should appear.
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="firstName">
              Legal first name
            </label>
            <input
              autoComplete="given-name"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              id="firstName"
              name="firstName"
              required
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lastName">
              Legal last name
            </label>
            <input
              autoComplete="family-name"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              id="lastName"
              name="lastName"
              required
              type="text"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cnaLicenseNumber">
            CNA License Number
          </label>
          <input
            autoComplete="off"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            id="cnaLicenseNumber"
            maxLength={64}
            name="cnaLicenseNumber"
            required
            type="text"
          />
          <p className="mt-1 text-xs text-slate-500">
            Your California CNA certificate number, as printed on your CNA card.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email address
          </label>
          <input
            autoComplete="email"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <PasswordInput
            autoComplete="new-password"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            id="password"
            name="password"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>

        {referredByCode ? (
          <div className="flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
            <span className="text-teal-600">✓</span>
            <span>
              Referred by a friend — code <strong>{referredByCode}</strong> applied
            </span>
          </div>
        ) : !showReferralInput ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700 underline"
              onClick={() => setShowReferralInput(true)}
            >
              Have a referral code?
            </button>
            <ReferralInfo />
          </div>
        ) : (
          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="referralCode"
            >
              Referral code <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              autoComplete="off"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm uppercase tracking-widest"
              id="referralCode"
              maxLength={8}
              onChange={(e) => setManualReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. CAL12345)"
              type="text"
              value={manualReferralCode}
            />
            <p className="mt-1 text-xs text-slate-500">
              Your friend earns a $3.75 credit when you make your first purchase.
            </p>
          </div>
        )}

        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Regional insights (optional)</p>
            <p className="mt-1 text-xs text-slate-500">
              Share your city to help CAL ACE understand regional CNA learning trends.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="city">
              City <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              autoComplete="address-level2"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!cityConsent}
              id="city"
              maxLength={100}
              name="city"
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Jose, Milpitas, Sacramento"
              type="text"
              value={city}
            />
            <p className="mt-1 text-xs text-slate-500">
              Used to show regional CNA learning trends — never shared with third parties.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              checked={cityConsent}
              className="mt-0.5"
              onChange={(e) => {
                const checked = e.target.checked;
                setCityConsent(checked);
                if (!checked) setCity('');
              }}
              type="checkbox"
            />
            <span>
              I consent to CAL ACE using my city for regional analytics and learner insights. I can
              withdraw this consent at any time by unchecking this box.
            </span>
          </label>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            checked={consent}
            className="mt-0.5"
            onChange={(e) => setConsent(e.target.checked)}
            type="checkbox"
          />
          <span>
            I agree to the{' '}
            <Link className="font-medium text-slate-900 hover:underline" href="/terms">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link className="font-medium text-slate-900 hover:underline" href="/privacy">
              Privacy Notice
            </Link>
            , and I consent to CAL ACE storing my information to manage my courses, certificates,
            and California CNA renewal records.
          </span>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <CaptchaField ref={captchaRef} action="signup" />

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="font-medium text-slate-900 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
      <p className="mt-6 text-center text-xs text-slate-500">{TENANT_PROVIDER_BRAND_LINE}</p>
    </div>
  );
}