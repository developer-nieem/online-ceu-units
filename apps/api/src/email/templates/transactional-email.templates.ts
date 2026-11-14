import { formatOnlineCeuHours } from '../../config/ceu-defaults';
import { SUPPORT_EMAIL_PLACEHOLDER } from '../../notifications/notification-preferences.types';

const BRAND = 'CAL ACE Nursing Academy';
const TEAL = '#0f766e';

/**
 * Postal address shown in every email footer (CAN-SPAM requires a valid
 * physical mailing address in commercial email). Confirmed by Dr. Cliff
 * 2026-10-09 as the official mailing address for the email footer.
 */
const POSTAL_ADDRESS = '1535 Landess Ave., Suite 103, Milpitas, CA 95035';

export type EmailFooterLinks = {
  /** Signed one-click unsubscribe URL (promotional email only). */
  unsubscribeUrl?: string;
  /** Link to the in-app notification preferences page. */
  managePrefsUrl?: string;
};

/** Footer for transactional / essential account email — no unsubscribe. */
function essentialFooterInner(links: EmailFooterLinks = {}): string {
  const manage = links.managePrefsUrl
    ? `<p style="margin:0 0 8px;">Manage which emails you receive in your <a href="${escapeAttr(links.managePrefsUrl)}" style="color:${TEAL};">account settings</a>.</p>`
    : '';
  return `
<p style="margin:0 0 8px;">Questions? Contact <a href="mailto:${SUPPORT_EMAIL_PLACEHOLDER}" style="color:${TEAL};">${SUPPORT_EMAIL_PLACEHOLDER}</a></p>
${manage}
<p style="margin:0 0 8px;">This is an essential account message about your CAL ACE learner account.</p>
<p style="margin:0 0 4px;">${BRAND} · ${POSTAL_ADDRESS}</p>
<p style="margin:0;">&copy; ${new Date().getFullYear()} ${BRAND}</p>`;
}

/** Footer for promotional / reminder email — includes a working unsubscribe. */
function promotionalFooterInner(links: EmailFooterLinks): string {
  const manage = links.managePrefsUrl
    ? ` or <a href="${escapeAttr(links.managePrefsUrl)}" style="color:${TEAL};">manage your email preferences</a>`
    : '';
  const unsubscribe = links.unsubscribeUrl
    ? `<p style="margin:0 0 8px;">Don't want these emails? <a href="${escapeAttr(links.unsubscribeUrl)}" style="color:${TEAL};font-weight:600;">Unsubscribe</a>${manage}.</p>`
    : '';
  return `
${unsubscribe}
<p style="margin:0 0 8px;">Questions? Contact <a href="mailto:${SUPPORT_EMAIL_PLACEHOLDER}" style="color:${TEAL};">${SUPPORT_EMAIL_PLACEHOLDER}</a></p>
<p style="margin:0 0 4px;">${BRAND} · ${POSTAL_ADDRESS}</p>
<p style="margin:0;">&copy; ${new Date().getFullYear()} ${BRAND}</p>`;
}

/** Plain-text footer lines appended to the text/* body of an email. */
function footerText(links: EmailFooterLinks = {}, promotional = false): string {
  const lines: string[] = ['', '—'];
  if (promotional && links.unsubscribeUrl) {
    lines.push(`Unsubscribe from these emails: ${links.unsubscribeUrl}`);
  }
  if (!promotional) {
    lines.push('This is an essential account message about your CAL ACE learner account.');
  }
  lines.push(`Contact: ${SUPPORT_EMAIL_PLACEHOLDER}`);
  lines.push(`${BRAND}, ${POSTAL_ADDRESS}`);
  return lines.join('\n');
}

type LayoutParams = {
  title: string;
  preheader?: string;
  bodyHtml: string;
  /** Inner HTML of the footer cell. Defaults to the essential footer. */
  footerHtml?: string;
};

function emailLayout({ title, preheader, bodyHtml, footerHtml }: LayoutParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  ${preheader ? `<meta name="description" content="${escapeHtml(preheader)}" />` : ''}
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${TEAL};padding:20px 24px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">${BRAND}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#ccfbf1;">Healthcare continuing education</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              ${footerHtml ?? essentialFooterInner()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0;">
  <a href="${escapeAttr(href)}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">${escapeHtml(label)}</a>
</p>`;
}

function backupLink(href: string): string {
  return `<p style="margin:16px 0 0;font-size:13px;color:#64748b;">If the button does not work, copy and paste this link into your browser:</p>
<p style="margin:8px 0 0;font-size:13px;word-break:break-all;"><a href="${escapeAttr(href)}" style="color:${TEAL};">${escapeHtml(href)}</a></p>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

export function buildVerificationEmail(params: {
  verifyUrl: string;
  firstName?: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const subject = 'Verify your email address — CAL ACE Nursing Academy';
  const text = [
    greeting,
    '',
    `Thank you for joining ${BRAND}. Please verify your email address to secure your account and receive certificates and important course notifications.`,
    '',
    `Verify your email (link expires in 24 hours):`,
    params.verifyUrl,
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
    '',
    'If you did not create an account, you can ignore this message.',
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Thank you for joining <strong>${BRAND}</strong>. Please verify your email address to secure your learner account and receive certificates and important course notifications.</p>
${ctaButton(params.verifyUrl, 'Verify email address')}
${backupLink(params.verifyUrl)}
<p style="margin:20px 0 0;font-size:13px;color:#64748b;"><strong>Important:</strong> This verification link expires in <strong>24 hours</strong>. After it expires, sign in and request a new verification email.</p>
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">If you did not create an account, you can safely ignore this message.</p>`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: 'Confirm your email to access your CAL ACE learner account.',
      bodyHtml,
    }),
  };
}

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  firstName?: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const subject = 'Reset your password — CAL ACE Nursing Academy';
  const text = [
    greeting,
    '',
    'We received a request to reset your CAL ACE learner account password.',
    '',
    `Reset your password (link expires in 1 hour):`,
    params.resetUrl,
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
    '',
    'If you did not request a password reset, you can ignore this message.',
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">We received a request to reset your CAL ACE learner account password.</p>
${ctaButton(params.resetUrl, 'Reset password')}
${backupLink(params.resetUrl)}
<p style="margin:20px 0 0;font-size:13px;color:#64748b;"><strong>Important:</strong> This reset link expires in <strong>1 hour</strong>.</p>
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">If you did not request a password reset, you can safely ignore this message.</p>`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: 'Reset your CAL ACE learner account password.',
      bodyHtml,
    }),
  };
}

export function buildWelcomeEmail(params: { firstName?: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const subject = 'Welcome to CAL ACE Nursing Academy';
  const text = [
    greeting,
    '',
    `Welcome to ${BRAND}. Your learner account is ready.`,
    '',
    'Sign in to browse continuing education courses, track your progress, and manage your California CNA renewal resources.',
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Welcome to <strong>${BRAND}</strong>. Your learner account is ready.</p>
<p style="margin:0 0 16px;font-size:15px;">Sign in to browse continuing education courses, track your progress, and manage your California CNA renewal resources.</p>
<p style="margin:0;font-size:15px;">Please verify your email address if you have not already done so — a separate verification message may have been sent.</p>`;

  return {
    subject,
    text,
    html: emailLayout({ title: subject, preheader: 'Your CAL ACE learner account is ready.', bodyHtml }),
  };
}

export function buildCertificateReadyEmail(params: {
  firstName?: string;
  courseTitle: string;
  certificateNo: string;
  ceuHours: number;
  verifyUrl: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const ceuLabel = formatOnlineCeuHours(params.ceuHours);
  const subject = `Your certificate is ready — ${params.courseTitle}`;
  const text = [
    greeting,
    '',
    `Congratulations on completing ${params.courseTitle}.`,
    '',
    `Your certificate of completion is ready. It reflects ${ceuLabel} and is recorded under certificate number ${params.certificateNo}.`,
    '',
    'View and verify your certificate:',
    params.verifyUrl,
    '',
    'You can share this verification link with employers or licensing boards so they can confirm your completion.',
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Congratulations on completing <strong>${escapeHtml(params.courseTitle)}</strong>.</p>
<p style="margin:0 0 16px;font-size:15px;">Your certificate of completion is ready. It reflects <strong>${escapeHtml(ceuLabel)}</strong> and is recorded under certificate number <strong>${escapeHtml(params.certificateNo)}</strong>.</p>
${ctaButton(params.verifyUrl, 'View & verify certificate')}
${backupLink(params.verifyUrl)}
<p style="margin:20px 0 0;font-size:13px;color:#64748b;">You can share this verification link with employers or licensing boards so they can confirm your completion.</p>`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: `Your certificate for ${escapeHtml(params.courseTitle)} is ready to view and verify.`,
      bodyHtml,
    }),
  };
}

export function buildEnrollmentConfirmedEmail(params: {
  firstName?: string;
  courseTitle: string;
  courseUrl: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const subject = `You're enrolled — ${params.courseTitle}`;
  const text = [
    greeting,
    '',
    `Your enrollment in ${params.courseTitle} is confirmed.`,
    '',
    'You can start the course whenever you are ready. Sign in to access lessons, track your progress, and complete the final exam when you finish the material.',
    '',
    'Start the course:',
    params.courseUrl,
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Your enrollment in <strong>${escapeHtml(params.courseTitle)}</strong> is confirmed.</p>
<p style="margin:0 0 16px;font-size:15px;">You can start the course whenever you are ready. Sign in to access lessons, track your progress, and complete the final exam when you finish the material.</p>
${ctaButton(params.courseUrl, 'Start course')}
${backupLink(params.courseUrl)}`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: `You're enrolled in ${escapeHtml(params.courseTitle)}.`,
      bodyHtml,
    }),
  };
}

export function buildReferralUsedEmail(params: {
  firstName?: string;
  links?: EmailFooterLinks;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const links = params.links ?? {};
  const subject = '🎉 Someone just used your CAL ACE referral code!';
  const text =
    [
      greeting,
      '',
      'Great news — someone just signed up using your referral code!',
      '',
      "Your referral is currently Pending. You'll receive your $3.75 reward credit when your friend completes their first qualifying purchase.",
      '',
      'Keep sharing your referral link to earn more credits.',
    ].join('\n') + footerText(links, true);

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Great news — someone just signed up using your referral code!</p>
<p style="margin:0 0 16px;font-size:15px;">Your referral is currently <strong>Pending</strong>. You'll receive your <strong>$3.75 reward credit</strong> when your friend completes their first qualifying purchase.</p>
<p style="margin:0;font-size:15px;">Keep sharing your referral link to earn more credits.</p>`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: 'Someone used your referral code.',
      bodyHtml,
      footerHtml: promotionalFooterInner(links),
    }),
  };
}

export function buildReferralConvertedEmail(params: {
  firstName?: string;
  links?: EmailFooterLinks;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const links = params.links ?? {};
  const subject = '🎉 Your referral reward has been added to your account!';
  const text =
    [
      greeting,
      '',
      'Congratulations — your referral completed their first purchase!',
      '',
      'Your $3.75 referral reward credit has been added to your account.',
      '',
      'Thank you for spreading the word about CAL ACE.',
    ].join('\n') + footerText(links, true);

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Congratulations — your referral completed their first purchase!</p>
<p style="margin:0 0 16px;font-size:15px;">Your <strong>$3.75 referral reward credit</strong> has been added to your account.</p>
<p style="margin:0;font-size:15px;">Thank you for spreading the word about CAL ACE.</p>`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: 'Your referral reward has been added.',
      bodyHtml,
      footerHtml: promotionalFooterInner(links),
    }),
  };
}

export function buildRenewalReminderEmail(params: {
  firstName?: string;
  daysRemaining: number;
  complianceUrl: string;
  links?: EmailFooterLinks;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const links = params.links ?? {};
  const subject = `⏰ ${params.daysRemaining} days until your CNA certification expires`;
  const text =
    [
      greeting,
      '',
      `Your CNA certification expires in ${params.daysRemaining} days.`,
      '',
      'Complete your 48 renewal CEU hours (at least 12 per year, max 24 online) before your expiration date.',
      '',
      'Track your renewal progress:',
      params.complianceUrl,
    ].join('\n') + footerText(links, true);

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Your CNA certification expires in <strong>${escapeHtml(String(params.daysRemaining))} days</strong>.</p>
<p style="margin:0 0 16px;font-size:15px;">Complete your <strong>48 renewal CEU hours</strong> (at least 12 per year, max 24 online) before your expiration date.</p>
${ctaButton(params.complianceUrl, 'Track your renewal progress')}
${backupLink(params.complianceUrl)}`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: `Your CNA certification expires in ${params.daysRemaining} days.`,
      bodyHtml,
      footerHtml: promotionalFooterInner(links),
    }),
  };
}

export function buildBehindPaceEmail(params: {
  firstName?: string;
  year: 1 | 2;
  hoursEarned: number;
  hoursNeeded: number;
  coursesUrl: string;
  links?: EmailFooterLinks;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const links = params.links ?? {};
  const gap = params.hoursNeeded;
  const gapLabel = `${gap} more hour${gap !== 1 ? 's' : ''}`;
  const subject = `📉 Year ${params.year} CEU hours are running short`;
  const text =
    [
      greeting,
      '',
      `Your Year ${params.year} CEU hours are running short.`,
      '',
      `You have ${params.hoursEarned} of 12 required hours in this window. You need ${gapLabel}.`,
      '',
      'Complete a course to stay on track:',
      params.coursesUrl,
    ].join('\n') + footerText(links, true);

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;"><strong>Year ${escapeHtml(String(params.year))}</strong> CEU hours are running short.</p>
<p style="margin:0 0 16px;font-size:15px;">You have <strong>${escapeHtml(String(params.hoursEarned))} of 12</strong> required hours. You need <strong>${escapeHtml(gapLabel)}</strong>.</p>
${ctaButton(params.coursesUrl, 'Complete a course')}
${backupLink(params.coursesUrl)}`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: `Year ${params.year} CEU hours are running short.`,
      bodyHtml,
      footerHtml: promotionalFooterInner(links),
    }),
  };
}

export function buildExamResultEmail(params: {
  firstName?: string;
  courseTitle: string;
  passed: boolean;
  scorePct?: number;
  courseUrl: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const scoreLine =
    params.scorePct !== undefined
      ? `Your score on this attempt was ${params.scorePct}%.`
      : null;

  if (params.passed) {
    const subject = `You passed — ${params.courseTitle}`;
    const text = [
      greeting,
      '',
      `Congratulations — you passed the final exam for ${params.courseTitle}.`,
      ...(scoreLine ? ['', scoreLine] : []),
      '',
      'Your certificate of completion is being prepared and will be available in your learner account. You will receive a separate notification when it is ready to view and verify.',
      '',
      'View your course:',
      params.courseUrl,
      '',
      `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
    ].join('\n');

    const scoreHtml = scoreLine
      ? `<p style="margin:0 0 16px;font-size:15px;">Your score on this attempt was <strong>${escapeHtml(String(params.scorePct))}%</strong>.</p>`
      : '';
    const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Congratulations — you passed the final exam for <strong>${escapeHtml(params.courseTitle)}</strong>.</p>
${scoreHtml}
<p style="margin:0 0 16px;font-size:15px;">Your certificate of completion is being prepared and will be available in your learner account. You will receive a separate notification when it is ready to view and verify.</p>
${ctaButton(params.courseUrl, 'View course')}
${backupLink(params.courseUrl)}`;

    return {
      subject,
      text,
      html: emailLayout({
        title: subject,
        preheader: `You passed the final exam for ${escapeHtml(params.courseTitle)}.`,
        bodyHtml,
      }),
    };
  }

  const subject = `Your exam attempt for ${params.courseTitle}`;
  const text = [
    greeting,
    '',
    `Thank you for completing your final exam attempt for ${params.courseTitle}.`,
    ...(scoreLine ? ['', scoreLine] : []),
    '',
    'Every attempt is progress. Review the course material and rationales, then return when you feel ready to try again.',
    '',
    'Return to your course:',
    params.courseUrl,
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
  ].join('\n');

  const scoreHtml = scoreLine
    ? `<p style="margin:0 0 16px;font-size:15px;">Your score on this attempt was <strong>${escapeHtml(String(params.scorePct))}%</strong>.</p>`
    : '';
  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Thank you for completing your final exam attempt for <strong>${escapeHtml(params.courseTitle)}</strong>.</p>
${scoreHtml}
<p style="margin:0 0 16px;font-size:15px;">Every attempt is progress. Review the course material and rationales, then return when you feel ready to try again.</p>
${ctaButton(params.courseUrl, 'Return to course')}
${backupLink(params.courseUrl)}`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: `Your final exam attempt for ${escapeHtml(params.courseTitle)} has been recorded.`,
      bodyHtml,
    }),
  };
}

export function buildCeuCompletionPlaceholderEmail(params: {
  courseTitle: string;
  firstName?: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const subject = 'CEU completion recorded — CAL ACE Nursing Academy';
  const text = [
    greeting,
    '',
    `Your completion for "${params.courseTitle}" has been recorded in your CAL ACE learner account.`,
    '',
    'Certificate delivery and transcript updates are managed in the platform.',
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Your completion for <strong>${escapeHtml(params.courseTitle)}</strong> has been recorded in your CAL ACE learner account.</p>
<p style="margin:0;font-size:15px;">Certificate delivery and transcript updates are managed in the platform. (This is a transactional placeholder for future certificate notifications.)</p>`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: 'Your course completion was recorded.',
      bodyHtml,
    }),
  };
}

function planLabel(plan: string): string {
  if (plan === 'unlimited-1y') return 'Unlimited 1-year access';
  if (plan === 'unlimited-2y') return 'Unlimited 2-year access';
  if (plan === 'single') return 'Single course';
  return plan;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function buildPaymentReceivedEmail(params: {
  firstName?: string;
  amountUsd: number;
  plan: string;
  orderNumber: string;
  courseTitle?: string;
  actionUrl: string;
}): { subject: string; text: string; html: string } {
  const greeting = params.firstName?.trim() ? `Hi ${params.firstName.trim()},` : 'Hello,';
  const planName = planLabel(params.plan);
  const amount = formatUsd(params.amountUsd);
  const subject = `Payment received — ${amount} via Stripe`;
  const courseLine = params.courseTitle
    ? `Course: ${params.courseTitle}`
    : 'Your unlimited plan is now active.';
  const text = [
    greeting,
    '',
    'Your Stripe payment is complete. This is your CAL ACE receipt.',
    '',
    `Amount: ${amount}`,
    `Plan: ${planName}`,
    `Order: ${params.orderNumber}`,
    courseLine,
    '',
    params.courseTitle ? 'Start the course:' : 'Go to your dashboard:',
    params.actionUrl,
    '',
    `Need help? Contact ${SUPPORT_EMAIL_PLACEHOLDER}.`,
  ].join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;">Your Stripe payment is complete. This is your CAL ACE receipt.</p>
<p style="margin:0 0 8px;font-size:15px;"><strong>Amount:</strong> ${escapeHtml(amount)}</p>
<p style="margin:0 0 8px;font-size:15px;"><strong>Plan:</strong> ${escapeHtml(planName)}</p>
<p style="margin:0 0 8px;font-size:15px;"><strong>Order:</strong> ${escapeHtml(params.orderNumber)}</p>
<p style="margin:0 0 16px;font-size:15px;">${escapeHtml(courseLine)}</p>
${ctaButton(params.actionUrl, params.courseTitle ? 'Start course' : 'Go to dashboard')}
${backupLink(params.actionUrl)}`;

  return {
    subject,
    text,
    html: emailLayout({
      title: subject,
      preheader: `Stripe payment received: ${escapeHtml(amount)} for ${escapeHtml(planName)}.`,
      bodyHtml,
    }),
  };
}
