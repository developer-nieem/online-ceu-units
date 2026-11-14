'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Printer } from 'lucide-react';

export function TranscriptPrintButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
      <Printer className="mr-1 h-4 w-4" aria-hidden />
      Print Transcript
    </Button>
  );
}
