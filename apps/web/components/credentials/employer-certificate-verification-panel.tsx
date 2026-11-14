'use client';

import { Badge } from '@calace/ui/components/ui/badge';
import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { Input } from '@calace/ui/components/ui/input';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import {
  verifyCertificateBySerialAndLastName,
  type PublicCertificateVerificationRecord,
  type PublicCertificateVerificationResponse,
} from '@/lib/certificate-verification';

function statusVariant(status: PublicCertificateVerificationRecord['status']) {
  if (status === 'Valid') return 'success' as const;
  if (status === 'Revoked') return 'warning' as const;
  return 'secondary' as const;
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate || isoDate === '—') return '—';
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function EmployerCertificateVerificationPanel() {
  const [serialNumber, setSerialNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicCertificateVerificationResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedSerial = serialNumber.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedSerial || !trimmedLastName) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await verifyCertificateBySerialAndLastName(trimmedSerial, trimmedLastName);
      setResult(response);
    } catch {
      setResult({
        found: false,
        message: 'Unable to verify this certificate right now. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }

  const record = result?.found ? result.record : null;
  const showInvalid = result !== null && (!result.found || !record);

  return (
    <div className="space-y-6">
      <Card className="border-teal-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Certificate lookup</CardTitle>
          <CardDescription>
            Enter the certificate serial number and the student&apos;s last name exactly as shown on
            the credential.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="serialNumber">
                Certificate serial number
              </label>
              <Input
                id="serialNumber"
                name="serialNumber"
                type="search"
                placeholder="e.g. CALACE-2026-AB12CD34"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="font-mono text-sm"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="lastName">
                Student last name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="search"
                placeholder="Last name on certificate"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Verifying…
                </>
              ) : (
                'Verify certificate'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showInvalid ? (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-semibold">Certificate not found or invalid</p>
            <p className="mt-1 text-amber-900">
              {result?.message ??
                'No matching certificate was found. Check the serial number and last name, then try again.'}
            </p>
          </div>
        </div>
      ) : null}

      {record ? (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden />
                <div>
                  <CardTitle className="text-lg text-emerald-950">Verified credential</CardTitle>
                  <CardDescription>
                    This record confirms issuance by CAL ACE Nursing Academy. No account or private
                    learner data is displayed.
                  </CardDescription>
                </div>
              </div>
              <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Student full name</dt>
                <dd className="font-medium text-slate-900">{record.learnerName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Course name</dt>
                <dd className="font-medium text-slate-900">{record.courseTitle}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Issue date</dt>
                <dd className="font-medium text-slate-900">{formatDisplayDate(record.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-slate-900">{record.status}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
