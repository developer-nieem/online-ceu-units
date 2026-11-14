import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { LifeBuoy } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/learner/page-header';
import { SupportTicketPanel } from '@/components/support/support-ticket-panel';
import { CnaRenewalFaqSection } from '@/components/support/cna-renewal-faq-section';
import { getServerSession } from '@/lib/auth-server';
import { SUPPORT_EMAIL } from '@/lib/support';
import { listMySupportTicketsServer } from '@/lib/support-server';

export default async function SupportPage() {
  const session = await getServerSession();
  const signedIn = Boolean(session.data?.user);
  const apiUnavailable = !signedIn && session.status === 503;
  const ticketResult = signedIn ? await listMySupportTicketsServer() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Get help with your account, courses, certificates, and California renewal questions."
      />

      {apiUnavailable ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-teal-700" aria-hidden />
              <CardTitle className="text-base">Support tickets</CardTitle>
            </div>
            <CardDescription>
              We could not reach the support service. Refresh this page, or email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-teal-800 underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/support">Try again</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SupportTicketPanel
          signedIn={signedIn}
          initialTickets={ticketResult?.ok ? ticketResult.tickets : []}
          loadFailed={Boolean(signedIn && ticketResult && !ticketResult.ok)}
        />
      )}

      <CnaRenewalFaqSection />
    </div>
  );
}
