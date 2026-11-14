/**
 * Full 1-CEU completion loop validation (development).
 *
 * Usage:
 *   pnpm --filter @calace/api run validate:completion-loop
 *
 * Optional env:
 *   SMOKE_COURSE_SLUG=dementia-care
 *   COMPLETION_HEARTBEAT_GAP_MS=11000  (realistic heartbeat spacing, ~12 min total)
 *   VALIDATION_FAST_SEAT_TIME=1        (dev only: set ledger via DB, then verify unlock)
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  NotificationChannel,
  PrismaClient,
  TranscriptEntryType,
} from '@calace/db';

const API = process.env.SMOKE_API_URL ?? 'http://localhost:3001/api';
const COURSE_SLUG = process.env.SMOKE_COURSE_SLUG ?? 'dementia-care';
const REQUIRED_SECONDS = 3000;
const HEARTBEAT_GAP_MS = Number(process.env.COMPLETION_HEARTBEAT_GAP_MS ?? 11_000);
const FAST_SEAT =
  process.env.VALIDATION_FAST_SEAT_TIME === '1' && process.env.NODE_ENV !== 'production';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.length > 0) process.env[key] = value;
  }
}

const repoRoot = resolve(__dirname, '../../..');
for (const f of [
  resolve(repoRoot, '.env'),
  resolve(repoRoot, '.env.local'),
  resolve(__dirname, '../.env.local'),
]) {
  loadEnvFile(f);
}

type StepResult = { step: string; ok: boolean; detail?: string };
const results: StepResult[] = [];
function record(step: string, ok: boolean, detail?: string) {
  results.push({ step, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${step}${detail ? ` — ${detail}` : ''}`);
}

function failDetail(status: number, json: unknown): string {
  const msg = (json as { message?: string | string[] })?.message;
  const text = Array.isArray(msg) ? msg.join('; ') : msg;
  return `status=${status}${text ? ` ${text}` : ''}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

class CookieJar {
  private cookies = new Map<string, string>();
  ingestFromResponse(headers: Headers) {
    const setCookies =
      typeof headers.getSetCookie === 'function'
        ? headers.getSetCookie()
        : headers.get('set-cookie')
          ? [headers.get('set-cookie')!]
          : [];
    for (const raw of setCookies) {
      if (!raw) continue;
      const pair = raw.split(';')[0]?.trim();
      if (!pair) continue;
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  set(name: string, value: string) {
    this.cookies.set(name, value);
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

const jar = new CookieJar();
let csrf = '';

async function api(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-calace-client': 'web',
  };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers['x-csrf-token'] = csrf;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  jar.ingestFromResponse(res.headers);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function refreshCsrf() {
  const csrfRes = await api('GET', '/auth/csrf');
  csrf = (csrfRes.json as { csrfToken?: string })?.csrfToken ?? csrf;
  if (csrf) jar.set('calace_csrf', csrf);
}

async function accelerateSeatTimeViaHeartbeats(
  courseSlug: string,
  lessonId: string,
  targetSeconds: number,
) {
  const sessionId = `validate_${Date.now()}`;
  let seq = 0;
  let activeSeconds = 0;
  const maxPerBeat = 45;
  const beatsNeeded = Math.ceil(targetSeconds / maxPerBeat);

  console.log(
    `  Accumulating ~${targetSeconds}s via ${beatsNeeded} heartbeats (${HEARTBEAT_GAP_MS}ms gap)...`,
  );

  for (let i = 0; i < beatsNeeded && activeSeconds < targetSeconds; i++) {
    const res = await api('POST', `/participation/courses/${courseSlug}/heartbeat`, {
      sessionId,
      clientSequence: ++seq,
      clientTimestamp: new Date().toISOString(),
      lessonId,
      tabVisible: true,
      documentFocused: true,
      idle: false,
      interactionDelta: 1,
      scrollDepthPct: 50,
    });
    const credited = (res.json as { creditedSeconds?: number })?.creditedSeconds ?? 0;
    activeSeconds =
      (res.json as { compliance?: { activeSeconds?: number } })?.compliance?.activeSeconds ??
      activeSeconds + credited;
    if ((i + 1) % 5 === 0 || activeSeconds >= targetSeconds) {
      console.log(`  … heartbeat ${i + 1}/${beatsNeeded}: activeSeconds=${activeSeconds}`);
    }
    if (activeSeconds < targetSeconds) await sleep(HEARTBEAT_GAP_MS);
  }
  return activeSeconds;
}

async function fastSeatTimeViaDb(prisma: PrismaClient, enrollmentId: string) {
  const row = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!row) return;
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const ledger = {
    version: 1 as const,
    activeSeconds: REQUIRED_SECONDS,
    interactionCount: 10,
    sessionId: 'validation_fast',
    lastHeartbeatAt: now,
    lastActiveAt: now,
    lastInteractionAt: now,
    lastClientSequence: 0,
    lastScrollDepthPct: 0,
    pausedSince: null,
    lessonActiveSeconds: {},
    events: [],
    seatTimeMinutes: 50,
    deliveryMode: 'online',
  };
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      metadata: {
        ...meta,
        participation: {
          ledger,
          seatTimeMinutes: 50,
          activeSeconds: REQUIRED_SECONDS,
          interactionCount: ledger.interactionCount,
          lastActivityAt: now,
          deliveryMode: 'online',
        },
      },
    },
  });
}

async function main() {
  const prisma = new PrismaClient();
  const email = `complete-${Date.now()}@learner.test`;
  const password = 'CompleteTest1!Aa';

  try {
    record('GET /api/health', (await api('GET', '/health')).status === 200);

    await refreshCsrf();
    record(
      'POST /auth/signup',
      (await api('POST', '/auth/signup', {
        email,
        password,
        firstName: 'Complete',
        lastName: 'Validator',
        cnaLicenseNumber: 'CNA-COMPLETE-0001',
      })).status === 201,
    );

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      record('DB user', false);
      return;
    }

    const emailRows = await prisma.notification.findMany({
      where: { userId: user.id, channel: NotificationChannel.EMAIL },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const verifyRow = emailRows.find(
      (r) => (r.payload as { template?: string })?.template === 'email_verification',
    );
    const token = (verifyRow?.payload as { verifyUrl?: string })?.verifyUrl?.match(
      /token=([^&]+)/,
    )?.[1];
    if (token) {
      const verify = await api(
        'GET',
        `/auth/verify-email?token=${encodeURIComponent(decodeURIComponent(token))}`,
      );
      record(
        'GET /auth/verify-email',
        verify.status === 200,
        verify.status >= 400 ? failDetail(verify.status, verify.json) : undefined,
      );
    } else {
      record('GET /auth/verify-email', false, 'no token in EMAIL notification');
    }

    await refreshCsrf();
    const logout = await api('POST', '/auth/logout', {});
    record(
      'POST /auth/logout',
      logout.status === 200 || logout.status === 201,
      logout.status >= 400 ? failDetail(logout.status, logout.json) : undefined,
    );
    await refreshCsrf();
    const login = await api('POST', '/auth/login', { email, password });
    record(
      'POST /auth/login',
      login.status === 200 || login.status === 201,
      login.status >= 400 ? failDetail(login.status, login.json) : undefined,
    );
    await refreshCsrf();

    const enroll = await api('POST', '/enrollments', {
      courseSlug: COURSE_SLUG,
      purchasePlan: 'single',
    });
    const enrollmentId = (enroll.json as { enrollment?: { id?: string } })?.enrollment?.id;
    record(
      'POST /enrollments',
      enroll.status === 200 || enroll.status === 201,
      `course=${COURSE_SLUG} id=${enrollmentId ?? 'none'}`,
    );
    if (!enrollmentId) return;

    const player = await api('GET', `/player/courses/${COURSE_SLUG}`);
    type PlayerLesson = {
      id: string;
      slug: string;
      contentFormat?: string;
      content?: { blocks?: { id: string; type: string; requiredForCompletion?: boolean }[] };
    };
    const lessons =
      (
        player.json as { modules?: { lessons?: PlayerLesson[] }[] }
      )?.modules?.flatMap((m) => m.lessons ?? []) ?? [];
    const interactiveTypes = new Set([
      'scenario_question',
      'knowledge_check',
      'reflection',
      'matching',
      'reveal_card',
      'arrange',
      'hotspot_image',
    ]);

    let firstLessonId = lessons[0]?.id;
    for (const lesson of lessons) {
      await api('POST', `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/view`, {
        enrollmentId,
        lessonId: lesson.id,
      });
      if (lesson.contentFormat === 'blocks' && lesson.content?.blocks?.length) {
        for (const block of lesson.content.blocks) {
          await api(
            'POST',
            `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/block-progress`,
            {
              enrollmentId,
              lessonId: lesson.id,
              eventType: 'block_viewed',
              blockId: block.id,
            },
          );
          if (block.requiredForCompletion || interactiveTypes.has(block.type)) {
            await api(
              'POST',
              `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/block-progress`,
              {
                enrollmentId,
                lessonId: lesson.id,
                eventType: 'interaction_completed',
                blockId: block.id,
                selectedOptionId: 'a',
                correct: true,
              },
            );
          }
        }
      }
      const complete = await api(
        'POST',
        `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/complete`,
        { enrollmentId, lessonId: lesson.id },
      );
      record(
        `lesson complete ${lesson.slug}`,
        complete.status === 200 || complete.status === 201,
        complete.status >= 400 ? failDetail(complete.status, complete.json) : undefined,
      );
      firstLessonId = lesson.id;
    }

    const overviewBefore = await api('GET', `/assessments/courses/${COURSE_SLUG}/final-exam`);
    const canStartBefore = (overviewBefore.json as { canStartAttempt?: boolean })?.canStartAttempt;
    record(
      'final exam locked before seat time',
      canStartBefore === false,
      `canStartAttempt=${canStartBefore}`,
    );

    const statusBefore = await api('GET', `/participation/courses/${COURSE_SLUG}/status`);
    const complianceBefore = statusBefore.json as {
      requiredSeconds?: number;
      requiredMinutes?: number;
      seatTimeMet?: boolean;
    };
    record(
      'participation requiredSeconds=3000',
      complianceBefore.requiredSeconds === REQUIRED_SECONDS,
      `requiredSeconds=${complianceBefore.requiredSeconds}`,
    );
    record(
      'seat time not met initially',
      complianceBefore.seatTimeMet === false,
      `activeMinutes=${(complianceBefore as { activeMinutes?: number }).activeMinutes}`,
    );

    const statusSeqBefore =
      (statusBefore.json as { activeSeconds?: number })?.activeSeconds ?? 0;
    const idleBeat = await api('POST', `/participation/courses/${COURSE_SLUG}/heartbeat`, {
      sessionId: `idle_${Date.now()}`,
      clientSequence: 1,
      clientTimestamp: new Date().toISOString(),
      lessonId: firstLessonId,
      tabVisible: false,
      documentFocused: false,
      idle: true,
      interactionDelta: 0,
    });
    const idleCredited = (idleBeat.json as { creditedSeconds?: number })?.creditedSeconds ?? 0;
    const afterIdle =
      (idleBeat.json as { compliance?: { activeSeconds?: number } })?.compliance?.activeSeconds ??
      statusSeqBefore;
    record(
      'idle tab does not advance seat time',
      idleCredited === 0 && afterIdle <= statusSeqBefore + 15,
      `credited=${idleCredited} activeSeconds=${afterIdle}`,
    );

    if (FAST_SEAT) {
      console.log('  VALIDATION_FAST_SEAT_TIME=1 — setting ledger via DB (development only)');
      await fastSeatTimeViaDb(prisma, enrollmentId);
    } else {
      const accumulated = await accelerateSeatTimeViaHeartbeats(
        COURSE_SLUG,
        firstLessonId ?? lessons[0]!.id,
        REQUIRED_SECONDS,
      );
      record(
        'seat time accumulated via heartbeats',
        accumulated >= REQUIRED_SECONDS,
        `activeSeconds=${accumulated}`,
      );
    }

    const statusAfter = await api('GET', `/participation/courses/${COURSE_SLUG}/status`);
    const met = (statusAfter.json as { seatTimeMet?: boolean })?.seatTimeMet;
    record('seatTimeMet after accumulation', met === true);

    const ack = await api('POST', `/assessments/courses/${COURSE_SLUG}/acknowledge-participation`, {});
    record('acknowledge participation', ack.status === 200 || ack.status === 201);

    const overviewReady = await api('GET', `/assessments/courses/${COURSE_SLUG}/final-exam`);
    const canStartAfter = (overviewReady.json as { canStartAttempt?: boolean })?.canStartAttempt;
    record(
      'final exam unlocks when requirements met',
      canStartAfter === true,
      `canStartAttempt=${canStartAfter}`,
    );

    const examStart = await api('POST', `/assessments/courses/${COURSE_SLUG}/final-exam/attempts`, {});
    const attempt = examStart.json as { attemptId?: string; questions?: { id: string }[] };
    record(
      'POST final-exam/attempts',
      examStart.status === 200 || examStart.status === 201,
      examStart.status >= 400 ? failDetail(examStart.status, examStart.json) : undefined,
    );

    if (attempt.attemptId) {
      const dbQuestions = await prisma.question.findMany({
        where: { id: { in: (attempt.questions ?? []).map((q) => q.id) } },
      });
      const answers: Record<string, unknown> = {};
      for (const q of dbQuestions) answers[q.id] = q.correctAnswer;

      const submit = await api('POST', `/assessments/attempts/${attempt.attemptId}/submit`, {
        answers,
      });
      const passed = (submit.json as { passed?: boolean })?.passed;
      record('final exam passed', passed === true, `score=${(submit.json as { score?: number }).score}`);

      if (passed) {
        const attest = await api(
          'POST',
          `/assessments/courses/${COURSE_SLUG}/attest-certificate-release`,
          { confirmed: true },
        );
        const finalized = (attest.json as { finalized?: boolean })?.finalized;
        record('certificate finalized', finalized === true);

        const certs = await api('GET', '/certificates/my');
        const certList = (certs.json as unknown[]) ?? [];
        const cert = certList[0] as {
          learnerName?: string;
          courseTitle?: string;
          ceuHours?: number;
          onlineCeuHoursLabel?: string;
          status?: string;
          verifyToken?: string | null;
          payload?: Record<string, unknown>;
        };
        record('GET /certificates/my', certList.length > 0);
        if (cert) {
          record(
            'certificate onlineCeuHours=1',
            cert.ceuHours === 1,
            `ceuHours=${cert.ceuHours}`,
          );
          record(
            'certificate onlineCeuHoursLabel',
            cert.onlineCeuHoursLabel === '1 Online CE hour',
            `label=${cert.onlineCeuHoursLabel}`,
          );
          record('certificate learner name', Boolean(cert.learnerName));
          record('certificate status ISSUED', cert.status === 'ISSUED');
          record(
            'certificate verify token',
            Boolean(cert.verifyToken),
            cert.verifyToken ? 'present' : 'missing',
          );
          const provider = cert.payload?.provider as { name?: string } | undefined;
          record('certificate provider identity', Boolean(provider?.name));
        }

        const transcript = await api('GET', '/transcript');
        const entries =
          (transcript.json as { entries?: unknown[] })?.entries ??
          (transcript.json as { count?: number }).count ??
          0;
        const entryCount = Array.isArray(entries) ? entries.length : Number(entries);
        record('transcript has completion entry', entryCount > 0, `entries=${entryCount}`);
        if (Array.isArray(entries) && entries[0]) {
          const e = entries[0] as {
            ceHours?: number;
            onlineCeuHoursLabel?: string;
            certificateId?: string;
          };
          record('transcript CE hours', e.ceHours === 1, `ceHours=${e.ceHours}`);
          record('transcript certificate ref', Boolean(e.certificateId));
        }

        const inApp = await prisma.notification.findMany({
          where: { userId: user.id, channel: NotificationChannel.IN_APP },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        const titles = inApp.map((n) => n.title);
        record(
          'notification: Final exam passed',
          titles.some((t) => t.includes('Final exam passed')),
          titles.slice(0, 3).join(' | '),
        );
        record(
          'notification: Certificate ready',
          titles.some((t) => t.includes('Certificate ready')),
          titles.slice(0, 3).join(' | '),
        );

        const progress = await api('GET', '/progress/summary');
        record('GET /progress/summary', progress.status === 200);

        const transcriptDb = await prisma.transcriptEntry.findFirst({
          where: {
            userId: user.id,
            entryType: TranscriptEntryType.COMPLETION,
          },
          orderBy: { createdAt: 'desc' },
        });
        record('DB transcript completion row', Boolean(transcriptDb));
      }
    }

    const failed = results.filter((r) => !r.ok);
    console.log(`\n--- Completion loop: ${results.length - failed.length}/${results.length} passed ---`);
    console.log(`Course tested: ${COURSE_SLUG}`);
    if (failed.length) {
      for (const f of failed) console.log(`  - ${f.step}: ${f.detail ?? ''}`);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(99);
});
