import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { BookOpen, CreditCard, FileText, ScrollText, Upload, Users } from 'lucide-react';
import Link from 'next/link';

import { CNA_NETWORK_URL } from '@/lib/cna-network';

const ACTIONS = [
  { label: 'Browse CEU courses', href: '/courses', icon: BookOpen },
  { label: 'Join the Community', href: CNA_NETWORK_URL, icon: Users, external: true },
  { label: 'View billing plans', href: '/billing', icon: CreditCard },
  { label: 'Upload in-person CEU', href: '/transcript', icon: Upload },
  { label: 'CDPH resources', href: '/resources#cdph', icon: FileText },
  { label: 'View completed courses', href: '/transcript', icon: ScrollText },
] as const;

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.label} variant="outline" className="h-auto justify-start gap-2 py-3" asChild>
              <Link
                href={action.href}
                {...('external' in action && action.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <Icon className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />
                <span className="text-left text-sm">{action.label}</span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
