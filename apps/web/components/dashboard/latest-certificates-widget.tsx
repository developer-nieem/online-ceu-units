import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Award } from 'lucide-react';
import Link from 'next/link';

import { formatOnlineCeuHours } from '@/lib/ceu-display';
import type { CertificateRecord } from '@/lib/credentials-types';

export function LatestCertificatesWidget({
  certificates,
}: {
  certificates: CertificateRecord[];
}) {
  const latest = certificates.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-5 w-5 text-teal-700" aria-hidden />
          Latest certificates
        </CardTitle>
        <CardDescription>Issued after course completion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {latest.map((c) => (
              <li key={c.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                <span className="font-medium">{c.courseTitle}</span>
                <span className="shrink-0 text-muted-foreground">
                  {c.onlineCeuHoursLabel ?? formatOnlineCeuHours(c.ceuHours)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/certificates" className="text-sm font-medium text-teal-800 underline">
          View all certificates
        </Link>
      </CardContent>
    </Card>
  );
}
