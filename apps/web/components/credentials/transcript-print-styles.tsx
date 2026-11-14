'use client';

const PRINT_STYLES = `
  @media print {
    body * {
      visibility: hidden;
    }
    .transcript-print-root,
    .transcript-print-root * {
      visibility: visible;
    }
    .transcript-print-root {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
`;

export function TranscriptPrintStyles() {
  return <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />;
}