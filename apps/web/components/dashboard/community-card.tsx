import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';

import { CNA_NETWORK_BRAND, CNA_NETWORK_URL } from '@/lib/cna-network';

export function CommunityCard({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href={CNA_NETWORK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50/50 p-4 transition-colors hover:bg-teal-50"
      >
        <Users aria-hidden className="size-5 shrink-0 text-teal-700" />
        <span className="text-sm font-medium text-teal-900">
          Join the Community at {CNA_NETWORK_URL.replace('https://', '')}
        </span>
      </Link>
    );
  }

  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <Users aria-hidden className="size-5" />
        </div>
        <CardTitle className="text-lg">Join the {CNA_NETWORK_BRAND}</CardTitle>
        <CardDescription>
          Connect with fellow CNAs, share renewal tips, and stay motivated throughout your CEU
          journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full sm:w-auto">
          <Link href={CNA_NETWORK_URL} target="_blank" rel="noopener noreferrer">
            Join the Community at www.cna.network
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
