'use client';

import { useState } from 'react';
import { Button } from '@calace/ui/components/ui/button';
import { Download } from 'lucide-react';

async function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll('img')];
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
}

export function CertificateDownloadButton({
  targetId,
  fileName,
}: {
  targetId: string;
  fileName: string;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    const node = document.getElementById(targetId);
    if (!node) return;

    setDownloading(true);
    try {
      await waitForImages(node);
      const [{ default: html2canvas }, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const JsPDF = jspdfModule.jsPDF;
      const capture = await html2canvas(node, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / capture.width, maxHeight / capture.height);
      const width = capture.width * ratio;
      const height = capture.height * ratio;
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;
      pdf.addImage(capture.toDataURL('image/png'), 'PNG', x, y, width, height);
      const pdfName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      pdf.save(pdfName);
    } catch (error) {
      console.error('Certificate PDF download failed', error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={downloading}
      onClick={() => void handleDownload()}
    >
      <Download className="mr-1 h-4 w-4" aria-hidden />
      {downloading ? 'Preparing PDF…' : 'Download PDF'}
    </Button>
  );
}
