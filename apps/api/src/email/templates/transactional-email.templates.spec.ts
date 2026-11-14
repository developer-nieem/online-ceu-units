import { describe, expect, it } from 'vitest';

import {
  buildBehindPaceEmail,
  buildCertificateReadyEmail,
  buildEnrollmentConfirmedEmail,
  buildPasswordResetEmail,
  buildPaymentReceivedEmail,
  buildReferralConvertedEmail,
  buildReferralUsedEmail,
  buildRenewalReminderEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
} from './transactional-email.templates';

const UNSUB = 'https://onlineceunits.com/unsubscribe?token=abc.def';
const MANAGE = 'https://onlineceunits.com/account';
const links = { unsubscribeUrl: UNSUB, managePrefsUrl: MANAGE };
const POSTAL = '1535 Landess Ave., Suite 103, Milpitas, CA 95035';

describe('promotional emails carry a working unsubscribe', () => {
  const promo = [
    ['referral used', buildReferralUsedEmail({ firstName: 'Cliff', links })],
    ['referral converted', buildReferralConvertedEmail({ firstName: 'Cliff', links })],
    [
      'renewal reminder',
      buildRenewalReminderEmail({
        firstName: 'Cliff',
        daysRemaining: 30,
        complianceUrl: 'https://onlineceunits.com/compliance',
        links,
      }),
    ],
    [
      'behind pace',
      buildBehindPaceEmail({
        firstName: 'Cliff',
        year: 1,
        hoursEarned: 4,
        hoursNeeded: 8,
        coursesUrl: 'https://onlineceunits.com/courses',
        links,
      }),
    ],
  ] as const;

  for (const [name, email] of promo) {
    it(`${name}: html + text include the unsubscribe URL and postal address`, () => {
      expect(email.html).toContain(UNSUB);
      expect(email.html).toContain('Unsubscribe');
      expect(email.html).toContain(POSTAL);
      expect(email.text).toContain(UNSUB);
    });
  }
});

describe('transactional emails never offer unsubscribe but stay compliant', () => {
  const txn = [
    ['verification', buildVerificationEmail({ verifyUrl: 'https://x/verify', firstName: 'C' })],
    ['password reset', buildPasswordResetEmail({ resetUrl: 'https://x/reset', firstName: 'C' })],
    ['welcome', buildWelcomeEmail({ firstName: 'C' })],
    [
      'certificate ready',
      buildCertificateReadyEmail({
        firstName: 'C',
        courseTitle: 'Infection Control',
        certificateNo: 'CERT-1',
        ceuHours: 2,
        verifyUrl: 'https://x/verify-cert',
      }),
    ],
    [
      'enrollment confirmed',
      buildEnrollmentConfirmedEmail({
        firstName: 'C',
        courseTitle: 'Infection Control',
        courseUrl: 'https://x/course',
      }),
    ],
    [
      'payment received',
      buildPaymentReceivedEmail({
        firstName: 'C',
        amountUsd: 19.5,
        plan: 'unlimited-1y',
        orderNumber: 'ORD-1',
        actionUrl: 'https://x/dashboard',
      }),
    ],
  ] as const;

  for (const [name, email] of txn) {
    it(`${name}: no unsubscribe link, but includes contact + postal address`, () => {
      expect(email.html).not.toContain('/unsubscribe?token=');
      expect(email.html.toLowerCase()).not.toContain('>unsubscribe<');
      expect(email.html).toContain('support@onlineceunits.com');
      expect(email.html).toContain(POSTAL);
    });
  }
});

describe('footer omits the unsubscribe control when no link is supplied', () => {
  it('referral built without links has no broken Unsubscribe anchor', () => {
    const email = buildReferralUsedEmail({ firstName: 'C' });
    expect(email.html).not.toContain('/unsubscribe?token=');
    // still a valid promotional footer with contact + address
    expect(email.html).toContain('support@onlineceunits.com');
    expect(email.html).toContain(POSTAL);
  });
});
