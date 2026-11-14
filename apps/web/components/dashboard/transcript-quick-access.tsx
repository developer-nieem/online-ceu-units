import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Button } from '@calace/ui/components/ui/button';
import { Download, ScrollText } from 'lucide-react';
import Link from 'next/link';

export function TranscriptQuickAccess({
  entryCount,
  totalCeHours,
}: {
  entryCount: number;
  totalCeHours: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-5 w-5 text-teal-700" aria-hidden />
          Transcript
        </CardTitle>
        <CardDescription>Official online CEU record for employers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {entryCount > 0
            ? `${entryCount} entries · ${totalCeHours} total CEU hours`
            : 'Your completed courses will appear on your transcript.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transcript">View transcript</Link>
          </Button>
          <Button variant="ghost" size="sm" disabled title="PDF export coming soon">
            <Download className="mr-1 h-4 w-4" aria-hidden />
            Download (soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
