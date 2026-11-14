import { MapPin, PartyPopper } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@calace/ui/components/ui/card';

import { TWO_YEAR_MILPITAS_PROMO } from '@/lib/marketing-copy';

type MilpitasCampusDiscountCardProps = {
  variant?: 'dashboard' | 'success';
  className?: string;
};

export function MilpitasCampusDiscountCard({
  variant = 'dashboard',
  className = '',
}: MilpitasCampusDiscountCardProps) {
  const isSuccess = variant === 'success';

  return (
    <Card
      className={`overflow-hidden border-amber-300/60 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/80 shadow-md ${className}`}
    >
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
            <PartyPopper aria-hidden className="size-5" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-bold text-amber-900">
              🎉 {TWO_YEAR_MILPITAS_PROMO.redemptionTitle}
            </p>
            <p className="text-sm leading-relaxed text-amber-950/90">
              {isSuccess
                ? TWO_YEAR_MILPITAS_PROMO.successBody
                : TWO_YEAR_MILPITAS_PROMO.redemptionBody}
            </p>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-800/80">
              <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {TWO_YEAR_MILPITAS_PROMO.conditions}
            </p>
            {!isSuccess ? (
              <Link
                href="/billing"
                className="inline-block text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
              >
                View billing & plan details
              </Link>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
