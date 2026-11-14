/**
 * Learner journey API smoke test (local dev).
 * Usage: pnpm --filter @calace/api run smoke:learner
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient, NotificationChannel } from '@calace/db';

const API = process.env.SMOKE_API_URL ?? 'http://localhost:3001/api';
const COURSE_SLUG = process.env.SMOKE_COURSE_SLUG ?? 'dementia-care';

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
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${step}${detail ? ` — ${detail}` : ''}`);
}

function failDetail(status: number, json: unknown): string {
  const msg = (json as { message?: string | string[] })?.message;
  const text = Array.isArray(msg) ? msg.join('; ') : msg;
  return `status=${status}${text ? ` ${text}` : ''}`;
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
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) this.cookies.set(name, value);
    }
  }

  set(name: string, value: string) {
    this.cookies.set(name, value);
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

const jar = new CookieJar();
let csrf = '';

async function api(
  method: string,
  path: string,
  body?: unknown,
  opts?: { public?: boolean },
): Promise<{ status: number; json: unknown; headers: Headers }> {
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
  return { status: res.status, json, headers: res.headers };
}

async function refreshCsrf() {
  const csrfRes = await api('GET', '/auth/csrf', undefined, { public: true });
  csrf = (csrfRes.json as { csrfToken?: string })?.csrfToken ?? csrf;
  if (csrf) jar.set('calace_csrf', csrf);
}

async function main() {
  const prisma = new PrismaClient();
  const email = `smoke-${Date.now()}@learner.test`;
  const password = 'SmokeTest1!Aa';

  try {
    const health = await api('GET', '/health', undefined, { public: true });
    record('GET /api/health', health.status === 200);

    const catalog = await api('GET', '/catalog/courses', undefined, { public: true });
    const courses = (catalog.json as { courses?: unknown[] })?.courses ?? catalog.json;
    record('GET /catalog/courses', catalog.status === 200, `items=${Array.isArray(courses) ? courses.length : '?'}`);

    const csrfRes = await api('GET', '/auth/csrf', undefined, { public: true });
    csrf = (csrfRes.json as { csrfToken?: string })?.csrfToken ?? '';
    if (csrf) jar.set('calace_csrf', csrf);
    record('GET /auth/csrf', csrfRes.status === 200 && Boolean(csrf));

    const signup = await api('POST', '/auth/signup', {
      email,
      password,
      firstName: 'Smoke',
      lastName: 'Learner',
      cnaLicenseNumber: 'CNA-SMOKE-0001',
    }, { public: true });
    record(
      'POST /auth/signup',
      signup.status === 201 || signup.status === 200,
      signup.status >= 400 ? failDetail(signup.status, signup.json) : undefined,
    );

    const me1 = await api('GET', '/auth/me');
    const verified1 = (me1.json as { user?: { emailVerified?: boolean } })?.user?.emailVerified;
    record('GET /auth/me (post-signup)', me1.status === 200, `emailVerified=${verified1}`);

    const user = await prisma.user.findFirst({ where: { email }, select: { id: true, tenantId: true } });
    if (!user) {
      record('DB user exists', false);
    } else {
      record('DB user exists', true, user.id);

      const emailRows = await prisma.notification.findMany({
        where: { userId: user.id, channel: NotificationChannel.EMAIL },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      const emailNotif = emailRows.find((row) => {
        const p = row.payload as { template?: string };
        return p?.template === 'email_verification';
      });
      const payload = (emailNotif?.payload ?? {}) as { verifyUrl?: string };
      const verifyUrl = payload.verifyUrl;
      const tokenMatch = verifyUrl?.match(/token=([^&]+)/);
      const token = tokenMatch?.[1] ? decodeURIComponent(tokenMatch[1]) : null;

      if (token) {
        const verify = await api('GET', `/auth/verify-email?token=${encodeURIComponent(token)}`, undefined, {
          public: true,
        });
        const v = verify.json as { verified?: boolean };
        record('GET /auth/verify-email', verify.status === 200 && v.verified === true);
      } else {
        record('GET /auth/verify-email', false, 'no verifyUrl in EMAIL notification payload (check SMTP/dev logs)');
      }
    }

    const me2 = await api('GET', '/auth/me');
    const verified2 = (me2.json as { user?: { emailVerified?: boolean } })?.user?.emailVerified;
    record('GET /auth/me (post-verify)', me2.status === 200, `emailVerified=${verified2}`);

    await refreshCsrf();

    const logout = await api('POST', '/auth/logout', {}, { public: true });
    record(
      'POST /auth/logout',
      logout.status === 200 || logout.status === 201,
      logout.status >= 400 ? failDetail(logout.status, logout.json) : undefined,
    );

    await refreshCsrf();

    const login = await api('POST', '/auth/login', { email, password }, { public: true });
    record(
      'POST /auth/login',
      login.status === 200 || login.status === 201,
      login.status >= 400 ? failDetail(login.status, login.json) : undefined,
    );

    await refreshCsrf();

    const me3 = await api('GET', '/auth/me');
    record('GET /auth/me (post-login)', me3.status === 200);

    const enroll = await api('POST', '/enrollments', {
      courseSlug: COURSE_SLUG,
      purchasePlan: 'single',
    });
    const enrollment = (enroll.json as { enrollment?: { id?: string } })?.enrollment;
    record(
      'POST /enrollments',
      enroll.status === 200 || enroll.status === 201,
      enroll.status >= 400
        ? failDetail(enroll.status, enroll.json)
        : `id=${enrollment?.id ?? 'none'}`,
    );

    const notif = await api('GET', '/notifications');
    const notifList = Array.isArray(notif.json) ? notif.json : (notif.json as { notifications?: unknown[] })?.notifications ?? [];
    record('GET /notifications', notif.status === 200, `count=${Array.isArray(notifList) ? notifList.length : '?'}`);

    const unread = await api('GET', '/notifications/unread-count');
    record('GET /notifications/unread-count', unread.status === 200);

    if (enrollment?.id) {
      const player = await api('GET', `/player/courses/${COURSE_SLUG}`);
      const state = player.json as {
        enrollment?: { id: string };
        modules?: { lessons?: { id: string; slug: string }[] }[];
      };
      record('GET /player/courses/:slug', player.status === 200);

      type PlayerLesson = {
        id: string;
        slug: string;
        contentFormat?: string;
        content?: { blocks?: { id: string; type: string; requiredForCompletion?: boolean }[] };
      };
      const lessons = state.modules?.flatMap((m) => (m.lessons ?? []) as PlayerLesson[]) ?? [];
      const interactiveTypes = new Set([
        'scenario_question',
        'knowledge_check',
        'reflection',
        'matching',
        'reveal_card',
        'arrange',
        'hotspot_image',
      ]);

      for (const lesson of lessons) {
        const view = await api('POST', `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/view`, {
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
        });
        if (view.status >= 400) {
          record(`lesson view ${lesson.slug}`, false, String(view.status));
          continue;
        }

        if (lesson.contentFormat === 'blocks' && lesson.content?.blocks?.length) {
          for (const block of lesson.content.blocks) {
            await api('POST', `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/block-progress`, {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
              eventType: 'block_viewed',
              blockId: block.id,
            });
            const needsInteraction =
              block.requiredForCompletion || interactiveTypes.has(block.type);
            if (needsInteraction) {
              await api('POST', `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/block-progress`, {
                enrollmentId: enrollment.id,
                lessonId: lesson.id,
                eventType: 'interaction_completed',
                blockId: block.id,
                selectedOptionId: 'a',
                correct: true,
              });
            }
          }
        }

        const complete = await api(
          'POST',
          `/player/courses/${COURSE_SLUG}/lessons/${lesson.slug}/complete`,
          { enrollmentId: enrollment.id, lessonId: lesson.id },
        );
        record(
          `lesson complete ${lesson.slug}`,
          complete.status === 200 || complete.status === 201,
          complete.status >= 400 ? failDetail(complete.status, complete.json) : undefined,
        );
      }

      const ack = await api('POST', `/assessments/courses/${COURSE_SLUG}/acknowledge-participation`, {});
      record(
        'POST acknowledge-participation',
        ack.status === 200 || ack.status === 201,
        ack.status >= 400 ? failDetail(ack.status, ack.json) : undefined,
      );

      const elig = await api('GET', `/assessments/courses/${COURSE_SLUG}/completion-eligibility`);
      const checks = (elig.json as { checks?: Record<string, boolean> })?.checks;
      const seatTimeMet = checks?.seatTimeMet ?? false;

      if (!seatTimeMet) {
        record(
          'POST final-exam/attempts',
          true,
          'SKIPPED: seat time not met in smoke (~50 min required for 1 CEU course)',
        );
        record('certificate/transcript flow', true, 'SKIPPED: depends on exam + seat time');
      } else {
      const examStart = await api('POST', `/assessments/courses/${COURSE_SLUG}/final-exam/attempts`, {});
      const attempt = examStart.json as {
        attemptId?: string;
        questions?: { id: string }[];
      };
      record(
        'POST final-exam/attempts',
        examStart.status === 200 || examStart.status === 201,
        examStart.status >= 400
          ? failDetail(examStart.status, examStart.json)
          : `attempt=${attempt.attemptId ?? 'none'}`,
      );

      if (attempt.attemptId) {
        const dbQuestions = await prisma.question.findMany({
          where: { id: { in: (attempt.questions ?? []).map((q) => q.id) } },
        });
        const answers: Record<string, unknown> = {};
        for (const q of dbQuestions) {
          answers[q.id] = q.correctAnswer as unknown;
        }
        const submit = await api('POST', `/assessments/attempts/${attempt.attemptId}/submit`, {
          answers,
        });
        const passed = (submit.json as { passed?: boolean })?.passed;
        record('POST submit final exam', submit.status === 200 || submit.status === 201, `passed=${passed}`);

        if (passed) {
          const attest = await api('POST', `/assessments/courses/${COURSE_SLUG}/attest-certificate-release`, {
            confirmed: true,
          });
          const finalized = (attest.json as { finalized?: boolean })?.finalized;
          record('POST attest-certificate-release', attest.status === 200 || attest.status === 201, `finalized=${finalized}`);

          const certs = await api('GET', '/certificates/my');
          record('GET /certificates', certs.status === 200);

          const transcript = await api('GET', '/transcript');
          const entries = (transcript.json as { entries?: unknown[] })?.entries ?? transcript.json;
          record(
            'GET /transcript',
            transcript.status === 200,
            `entries=${Array.isArray(entries) ? entries.length : '?'}`,
          );
        }
      }
      }
    }

    const profile = await api('GET', '/account/profile');
    record('GET /account/profile', profile.status === 200);

    if (Array.isArray(notifList) && notifList.length > 0) {
      const first = notifList[0] as { id: string };
      const read = await api('PATCH', `/notifications/${first.id}/read`, {});
      record('PATCH notification read', read.status === 200);
      const archive = await api('PATCH', `/notifications/${first.id}/archive`, {});
      record('PATCH notification archive', archive.status === 200);
    }

    const failed = results.filter((r) => !r.ok);
    console.log('\n--- Summary ---');
    console.log(`Passed: ${results.length - failed.length}/${results.length}`);
    if (failed.length) {
      console.log('Failed steps:');
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
