'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import {
  CALACE_DISPLAY_TIMEZONE,
  DEFAULT_INSTITUTION_LEGAL_NAME,
} from '@calace/ui/components/certificate';
import Link from 'next/link';
import { Download, Printer } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { ParticipationMeter } from '@/components/participation/participation-meter';
import { CertificateParticipationLock } from '@/components/participation/participation-prompt';
import { attestCertificateRelease } from '@/lib/assessments';
import { getAccountProfile, updateAccountProfile } from '@/lib/account';
import { showMilestoneBadgeCelebration } from '@/lib/celebration';
import type { ParticipationComplianceStatus } from '@/lib/participation';

const SIGNATURE_CANVAS_WIDTH = 640;
const SIGNATURE_CANVAS_HEIGHT = 120;

const ATTESTATION_PRINT_STYLES = `
  @media print {
    body * {
      visibility: hidden;
    }
    .attestation-print-root,
    .attestation-print-root * {
      visibility: visible;
    }
    .attestation-print-root {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .attestation-print-hide {
      display: none !important;
    }
    .attestation-signature-print-img {
      display: block !important;
      width: 100%;
      height: auto;
      max-height: 120px;
      object-fit: contain;
    }
  }
  .attestation-print-root.attestation-pdf-capturing .attestation-print-hide {
    display: none !important;
  }
  .attestation-print-root.attestation-pdf-capturing .attestation-signature-print-img {
    display: block !important;
    width: 100%;
    height: auto;
    max-height: 120px;
    object-fit: contain;
  }
  .attestation-print-root.attestation-pdf-capturing .attestation-signature-print-typed {
    display: flex !important;
  }
  .attestation-print-root.attestation-pdf-capturing .attestation-signature-print-blank {
    display: block !important;
  }
`;

function formatCeHoursValue(ceHours: number): string {
  const n = Number(ceHours);
  if (!Number.isFinite(n) || n <= 0) return '1';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function ceHoursWord(ceHours: number): string {
  const n = Number(ceHours);
  if (n === 1) return 'One';
  if (n === 2) return 'Two';
  if (n === 3) return 'Three';
  return formatCeHoursValue(ceHours);
}

function formatAttestationDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: CALACE_DISPLAY_TIMEZONE,
  }).format(date);
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function waitForImage(img: HTMLImageElement | null): Promise<void> {
  if (!img || img.complete) return Promise.resolve();
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Signature image failed to load'));
  });
}

function revealSignatureForPdfCapture(clonedRoot: HTMLElement) {
  clonedRoot.querySelectorAll('.attestation-print-hide').forEach((el) => {
    (el as HTMLElement).style.setProperty('display', 'none', 'important');
  });
  clonedRoot.querySelectorAll('.attestation-signature-print-img').forEach((el) => {
    const node = el as HTMLElement;
    node.classList.remove('hidden');
    node.style.setProperty('display', 'block', 'important');
    node.style.width = '100%';
    node.style.height = 'auto';
    node.style.maxHeight = '120px';
    node.style.objectFit = 'contain';
  });
  clonedRoot.querySelectorAll('.attestation-signature-print-typed').forEach((el) => {
    const node = el as HTMLElement;
    node.classList.remove('hidden');
    node.style.setProperty('display', 'flex', 'important');
  });
  clonedRoot.querySelectorAll('.attestation-signature-print-blank').forEach((el) => {
    const node = el as HTMLElement;
    node.classList.remove('hidden');
    node.style.setProperty('display', 'block', 'important');
  });
}

function pointerToCanvas(
  event: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function SignaturePad({
  typedSignature,
  onTypedSignatureChange,
  printSnapshot,
  onInkChange,
}: {
  typedSignature: string;
  onTypedSignatureChange: (value: string) => void;
  printSnapshot: string | null;
  onInkChange: (hasInk: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [hasInk, setHasInk] = useState(false);

  const setInk = useCallback(
    (next: boolean) => {
      setHasInk(next);
      onInkChange(next);
    },
    [onInkChange],
  );

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setInk(false);
  }

  function handleClear() {
    clearCanvas();
    onTypedSignatureChange('');
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointerToCanvas(event, canvas);
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;
    const next = pointerToCanvas(event, canvas);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    lastPointRef.current = next;
    if (!hasInk) setInk(true);
  }

  function endDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  const showTyped = mode === 'type' && typedSignature.trim().length > 0;
  const showDrawnPrint = mode === 'draw' && Boolean(printSnapshot);

  return (
    <div>
      <div className="attestation-print-hide space-y-2">
        {mode === 'draw' ? (
          <canvas
            ref={canvasRef}
            width={SIGNATURE_CANVAS_WIDTH}
            height={SIGNATURE_CANVAS_HEIGHT}
            className="h-[120px] w-full touch-none select-none border-b border-slate-800 bg-white"
            style={{ width: '100%', height: '120px' }}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
            aria-label="Draw your signature"
          />
        ) : (
          <div className="flex h-[120px] items-end border-b border-slate-800 bg-white px-1">
            <input
              type="text"
              value={typedSignature}
              onChange={(e) => onTypedSignatureChange(e.target.value)}
              placeholder="Type your signature"
              className="mb-1 w-full border-0 bg-transparent text-3xl italic text-slate-900 outline-none"
              style={{ fontFamily: 'Georgia, "Palatino Linotype", cursive, serif' }}
              aria-label="Type your signature"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (mode === 'draw') {
                clearCanvas();
                setMode('type');
              } else {
                onTypedSignatureChange('');
                setMode('draw');
              }
            }}
          >
            {mode === 'draw' ? 'Type signature instead' : 'Draw signature instead'}
          </Button>
        </div>
      </div>

      {showDrawnPrint ? (
        <img
          src={printSnapshot ?? ''}
          alt="Participant signature"
          className="attestation-signature-print-img hidden max-h-[120px] w-full border-b border-slate-800 object-contain"
        />
      ) : showTyped ? (
        <div className="attestation-signature-print-typed hidden h-[120px] items-end border-b border-slate-800 print:flex">
          <p
            className="mb-1 text-3xl italic text-slate-900"
            style={{ fontFamily: 'Georgia, "Palatino Linotype", cursive, serif' }}
          >
            {typedSignature}
          </p>
        </div>
      ) : (
        <div
          className="attestation-signature-print-blank hidden h-12 border-b border-slate-800 print:block"
          aria-hidden
        />
      )}
      <p className="mt-1 text-xs text-slate-600">Participant Signature</p>
    </div>
  );
}

export function CertificateAttestation({
  courseSlug,
  courseTitle,
  participantName,
  ceHours,
  attestationText,
  participation,
  seatTimeMinutes,
  requiredSeatTimeMinutes,
  seatTimeMet = true,
  onCompleted,
}: {
  courseSlug: string;
  courseTitle: string;
  participantName: string;
  ceHours: number;
  attestationText: string;
  participation?: ParticipationComplianceStatus | null;
  seatTimeMinutes?: number;
  requiredSeatTimeMinutes?: number;
  seatTimeMet?: boolean;
  onCompleted?: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [hasDrawnInk, setHasDrawnInk] = useState(false);
  const [printSnapshot, setPrintSnapshot] = useState<string | null>(null);
  const [printNonce, setPrintNonce] = useState(0);
  const [pdfCapturing, setPdfCapturing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [cnaLicenseNumber, setCnaLicenseNumber] = useState('');
  const [savedCnaLicenseNumber, setSavedCnaLicenseNumber] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const printRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAccountProfile()
      .then((result) => {
        if (cancelled) return;
        const existing = result.data?.editable.cnaLicenseNumber?.trim() ?? '';
        setCnaLicenseNumber(existing);
        setSavedCnaLicenseNumber(existing);
        setProfileLoading(false);
      })
      .catch(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeMinutes = participation?.activeMinutes ?? seatTimeMinutes ?? 0;
  const requiredMinutes =
    participation?.requiredMinutes ?? requiredSeatTimeMinutes ?? 50;
  const remainingMinutes =
    participation?.remainingMinutes ??
    Math.max(0, requiredMinutes - activeMinutes);
  const canClaim = participation?.seatTimeMet ?? seatTimeMet;
  const trimmedCnaLicense = cnaLicenseNumber.trim();
  const hasCnaLicense = trimmedCnaLicense.length > 0;
  const canRelease = canClaim && hasCnaLicense;
  const ceHoursLabel = formatCeHoursValue(ceHours);
  const ceUnitLabel = Number(ceHours) === 1 ? 'CE Unit' : 'CE Units';
  const ceUnitLine = `${ceUnitLabel} - ${ceHoursWord(ceHours)} (${ceHoursLabel})`;
  const attestationDate = formatAttestationDate(new Date());

  function handlePrintAttestation() {
    const canvas = document.querySelector(
      '.attestation-print-root canvas',
    ) as HTMLCanvasElement | null;
    if (hasDrawnInk && canvas) {
      setPrintSnapshot(canvas.toDataURL('image/png'));
    } else {
      setPrintSnapshot(null);
    }
    setPrintNonce((n) => n + 1);
  }

  useEffect(() => {
    if (printNonce === 0) return;
    const frame = requestAnimationFrame(() => {
      const previousTitle = document.title;
      document.title = `${participantName} - Completion Attestation`;
      window.print();
      document.title = previousTitle;
    });
    return () => cancelAnimationFrame(frame);
  }, [printNonce, participantName]);

  async function handleDownloadPdf() {
    if (pdfGenerating) return;
    const root = printRootRef.current;
    if (!root) {
      setPdfError('Could not generate the PDF. Please try Print attestation.');
      return;
    }

    const previousSnapshot = printSnapshot;
    setPdfGenerating(true);
    setPdfError(null);

    try {
      const canvas = root.querySelector('canvas');
      const snapshot =
        hasDrawnInk && canvas ? canvas.toDataURL('image/png') : null;

      flushSync(() => {
        setPrintSnapshot(snapshot);
        setPdfCapturing(true);
      });
      await waitForNextPaint();
      await waitForImage(
        root.querySelector('.attestation-signature-print-img'),
      );

      const [{ default: html2canvas }, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const JsPDF = jspdfModule.jsPDF;

      const capture = await html2canvas(root, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (_clonedDoc, clonedElement) => {
          clonedElement.style.backgroundColor = '#ffffff';
          clonedElement.classList.add('attestation-pdf-capturing');
          revealSignatureForPdfCapture(clonedElement);
        },
      });

      const pdf = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / capture.width, maxHeight / capture.height);
      const width = capture.width * ratio;
      const height = capture.height * ratio;
      const x = (pageWidth - width) / 2;
      const y = margin;
      pdf.addImage(capture.toDataURL('image/png'), 'PNG', x, y, width, height);
      pdf.save(`${participantName} - Completion Attestation.pdf`);
    } catch (err) {
      console.error('Attestation PDF download failed', err);
      setPdfError('Could not generate the PDF. Please try again, or use Print attestation.');
    } finally {
      flushSync(() => {
        setPdfCapturing(false);
        setPrintSnapshot(previousSnapshot);
      });
      setPdfGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!confirmed || !canClaim) return;
    if (!hasCnaLicense) {
      setError('Please enter your CNA License Number.');
      return;
    }
    if (trimmedCnaLicense.length > 64) {
      setError('CNA License Number must be 64 characters or fewer.');
      return;
    }
    setLoading(true);
    setError(null);
    if (trimmedCnaLicense !== savedCnaLicenseNumber) {
      const saved = await updateAccountProfile({ cnaLicenseNumber: trimmedCnaLicense });
      if (saved.error || !saved.data) {
        setLoading(false);
        setError(saved.error ?? 'Could not save your CNA License Number. Please try again.');
        return;
      }
      const persisted = saved.data.editable.cnaLicenseNumber?.trim() ?? trimmedCnaLicense;
      setSavedCnaLicenseNumber(persisted);
      setCnaLicenseNumber(persisted);
    }
    const res = await attestCertificateRelease(courseSlug);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.newBadgeEarned) {
      showMilestoneBadgeCelebration(res.data.newBadgeEarned);
    }
    setDone(true);
    onCompleted?.();
  }

  if (done) {
    return (
      <Card className="border-teal-300 bg-teal-50">
        <CardContent className="space-y-3 pt-6 text-sm text-teal-950">
          <p className="font-medium">Attestation recorded. Your certificate is being issued.</p>
          <p className="text-muted-foreground">
            PDF download is not available yet — view your certificate record on the certificates
            page.
          </p>
          <Button asChild size="sm">
            <Link href="/certificates">View certificates</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {participation ? <ParticipationMeter status={participation} /> : null}

      <CertificateParticipationLock
        activeMinutes={activeMinutes}
        requiredMinutes={requiredMinutes}
        remainingMinutes={remainingMinutes}
        seatTimeMet={canClaim}
      />

      <Card className="border-teal-300">
        <CardHeader>
          <CardTitle className="text-base">
            Participant Completion Attestation (for your records)
          </CardTitle>
          <CardDescription>
            Sign physically or digitally, then print or download a copy for your records. Keep it
            with your certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div
            ref={printRootRef}
            className={`attestation-print-root rounded-lg border border-slate-200 bg-[#faf9f6] p-6 print:border-0 print:bg-white print:p-0${
              pdfCapturing ? ' attestation-pdf-capturing' : ''
            }`}
          >
            <p className="text-center text-xs font-medium tracking-wide text-slate-600">
              {DEFAULT_INSTITUTION_LEGAL_NAME}
            </p>
            <p className="mt-1 text-center text-xs font-medium tracking-wide text-slate-600">
              CAL ACE Nursing Academy
            </p>
            <p className="mt-1 text-center text-xs font-medium tracking-wide text-slate-600">
              NAC# 7384
            </p>
            <h3 className="mt-2 text-center text-base font-semibold text-slate-900">
              Participant Completion Attestation
            </h3>
            <p className="mt-4 leading-relaxed text-slate-800">
              I certify that I, <span className="font-semibold">{participantName}</span>, personally
              completed this online continuing education course, &ldquo;{courseTitle}&rdquo;
              (equivalent to {ceHoursLabel} CE), including all lessons and the required assessment.
            </p>
            <dl className="mt-4 space-y-1 text-slate-800">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Participant name
                </dt>
                <dd className="font-semibold">{participantName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Course title
                </dt>
                <dd>{courseTitle}</dd>
                <p className="mt-1">{ceUnitLine}</p>
              </div>
            </dl>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <SignaturePad
                typedSignature={typedSignature}
                onTypedSignatureChange={setTypedSignature}
                printSnapshot={printSnapshot}
                onInkChange={setHasDrawnInk}
              />
              <div>
                <div className="flex h-12 items-end border-b border-slate-800">
                  <p className="mb-1 text-sm text-slate-800">{attestationDate}</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">Date</p>
                <p className="mt-1 text-xs text-slate-600">
                  Noted by: CAL ACE Nursing Academy
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-800">
              Printed name: <span className="font-medium">{participantName}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handlePrintAttestation}>
              <Printer className="mr-1 h-4 w-4" aria-hidden />
              Print attestation
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pdfGenerating}
              onClick={() => void handleDownloadPdf()}
            >
              <Download className="mr-1 h-4 w-4" aria-hidden />
              {pdfGenerating ? 'Generating…' : 'Download as PDF'}
            </Button>
          </div>
          {pdfError ? <p className="text-red-600">{pdfError}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Learner attestation</CardTitle>
          <CardDescription>
            {canClaim
              ? hasCnaLicense
                ? 'Required before certificate release'
                : 'Add your CNA License Number to receive your certificate'
              : 'Complete active participation time before attesting'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">{attestationText}</p>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">CNA License Number</span>
            <span className="block text-xs text-muted-foreground">
              Required to issue your certificate. This is the number on your CNA card.
            </span>
            <input
              className="mt-1 h-10 w-full max-w-md rounded-md border border-slate-300 px-3 text-sm"
              maxLength={64}
              value={cnaLicenseNumber}
              disabled={profileLoading || loading}
              onChange={(e) => setCnaLicenseNumber(e.target.value)}
              placeholder={profileLoading ? 'Loading…' : 'Enter your CNA License Number'}
            />
          </label>
          {!hasCnaLicense && !profileLoading ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
              Add your CNA License Number to receive your certificate. You can keep this course
              open — only certificate release waits on this number.{' '}
              <Link href="/account/profile" className="font-medium underline">
                Open profile
              </Link>
            </p>
          ) : null}
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              disabled={!canClaim}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I confirm the statement above</span>
          </label>
          {error ? <p className="text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!confirmed || !canRelease || loading || profileLoading}
              onClick={() => void handleSubmit()}
            >
              {loading ? 'Submitting…' : 'Submit attestation & release certificate'}
            </Button>
            {!canClaim ? (
              <Button type="button" variant="outline" asChild>
                <Link href={`/courses/${courseSlug}/learn`}>Return to lessons</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: ATTESTATION_PRINT_STYLES }} />
    </div>
  );
}
