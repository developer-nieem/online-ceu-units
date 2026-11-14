'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Download } from 'lucide-react';

export function TranscriptDownloadButton({
  targetId,
  fileName,
}: {
  targetId: string;
  fileName: string;
}) {
  function handleDownload() {
    const node = document.getElementById(targetId);
    if (!node) return;
    const previousTitle = document.title;
    document.title = fileName;
    window.print();
    document.title = previousTitle;
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
      <Download className="mr-1 h-4 w-4" aria-hidden />
      Download transcript PDF
    </Button>
  );
}
