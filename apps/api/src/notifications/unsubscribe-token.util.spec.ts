import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  UNSUBSCRIBE_SCOPE,
  buildOneClickUnsubscribeUrl,
  buildUnsubscribeUrl,
  scopeToPreferencePatch,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token.util';

const SECRET = 'test-unsubscribe-secret-value-123456';
const OTHER_SECRET = 'a-different-secret-value-7890-abcdef';

describe('unsubscribe token sign/verify', () => {
  it('round-trips a valid token', () => {
    const token = signUnsubscribeToken(SECRET, {
      t: 'tenant_1',
      u: 'user_abc',
      s: UNSUBSCRIBE_SCOPE.COURSE_REMINDERS,
    });
    const decoded = verifyUnsubscribeToken(SECRET, token);
    expect(decoded).toEqual({
      v: 1,
      t: 'tenant_1',
      u: 'user_abc',
      s: UNSUBSCRIBE_SCOPE.COURSE_REMINDERS,
    });
  });

  it('rejects a token signed with a different secret', () => {
    const token = signUnsubscribeToken(OTHER_SECRET, {
      t: 'tenant_1',
      u: 'user_abc',
      s: UNSUBSCRIBE_SCOPE.MARKETING,
    });
    expect(verifyUnsubscribeToken(SECRET, token)).toBeNull();
  });

  it('rejects a tampered payload (changed user id)', () => {
    const token = signUnsubscribeToken(SECRET, {
      t: 'tenant_1',
      u: 'user_abc',
      s: UNSUBSCRIBE_SCOPE.MARKETING,
    });
    const [, sig] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ v: 1, t: 'tenant_1', u: 'user_victim', s: 'marketing' }),
    ).toString('base64url');
    const forged = `${forgedBody}.${sig}`;
    expect(verifyUnsubscribeToken(SECRET, forged)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyUnsubscribeToken(SECRET, '')).toBeNull();
    expect(verifyUnsubscribeToken(SECRET, 'no-dot')).toBeNull();
    expect(verifyUnsubscribeToken(SECRET, '.sigonly')).toBeNull();
    expect(verifyUnsubscribeToken(SECRET, 'bodyonly.')).toBeNull();
    expect(verifyUnsubscribeToken(SECRET, 'a.b.c')).toBeNull();
  });

  it('rejects a correctly-signed token carrying an unknown scope', () => {
    // Valid signature over a body whose scope is not in the allow-list.
    const body = Buffer.from(
      JSON.stringify({ v: 1, t: 'tenant_1', u: 'user_abc', s: 'everything' }),
    ).toString('base64url');
    const goodSig = createHmac('sha256', SECRET).update(body).digest('base64url');
    expect(verifyUnsubscribeToken(SECRET, `${body}.${goodSig}`)).toBeNull();
  });
});

describe('scopeToPreferencePatch', () => {
  it('maps course-reminders to courseRemindersEnabled=false', () => {
    expect(scopeToPreferencePatch(UNSUBSCRIBE_SCOPE.COURSE_REMINDERS)).toEqual({
      courseRemindersEnabled: false,
    });
  });
  it('maps marketing to marketingEmailsEnabled=false', () => {
    expect(scopeToPreferencePatch(UNSUBSCRIBE_SCOPE.MARKETING)).toEqual({
      marketingEmailsEnabled: false,
    });
  });
  it('maps all to emailEnabled=false', () => {
    expect(scopeToPreferencePatch(UNSUBSCRIBE_SCOPE.ALL)).toEqual({
      emailEnabled: false,
    });
  });
});

describe('url builders', () => {
  it('builds a confirmation page URL with an encoded token', () => {
    const token = signUnsubscribeToken(SECRET, {
      t: 't',
      u: 'u',
      s: UNSUBSCRIBE_SCOPE.ALL,
    });
    const url = buildUnsubscribeUrl('https://onlineceunits.com/', token);
    expect(url).toBe(
      `https://onlineceunits.com/unsubscribe?token=${encodeURIComponent(token)}`,
    );
  });

  it('builds the RFC 8058 one-click URL through the api proxy', () => {
    const url = buildOneClickUnsubscribeUrl('https://onlineceunits.com', 'tok en');
    expect(url).toBe(
      'https://onlineceunits.com/api/notifications/unsubscribe/one-click?token=tok%20en',
    );
  });
});
