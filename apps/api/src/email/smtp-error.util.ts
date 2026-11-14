export type SmtpErrorCategory =
  | 'missing_env'
  | 'invalid_credentials'
  | 'auth_rejected'
  | 'connection_timeout'
  | 'connection_refused'
  | 'tls_error'
  | 'sender_rejected'
  | 'recipient_rejected'
  | 'unknown';

export type SmtpEnvDiagnostic = {
  configured: boolean;
  missing: string[];
  host?: string;
  port?: number;
  user?: string;
  from?: string;
  secure?: boolean;
  passwordPresent?: boolean;
  portPresent?: boolean;
};

/** Safe one-line SMTP env status (never logs password value). */
export function formatSafeSmtpStatus(
  diagnostic: SmtpEnvDiagnostic,
  source: 'ConfigService' | 'process.env',
): string {
  const present = (v: string | undefined) => (v && v.length > 0 ? 'present' : 'missing');
  return [
    `[smtp-env:${source}]`,
    `configured=${diagnostic.configured}`,
    `host=${present(diagnostic.host)}`,
    `port=${diagnostic.portPresent ? `present(${diagnostic.port})` : `default(${diagnostic.port ?? 587})`}`,
    `user=${present(diagnostic.user)}`,
    `password=${diagnostic.passwordPresent ? 'present' : 'missing'}`,
    `from=${present(diagnostic.from)}`,
    diagnostic.missing.length ? `missingKeys=${diagnostic.missing.join(',')}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function diagnoseSmtpEnv(get: (key: string) => string | undefined): SmtpEnvDiagnostic {
  const host = get('SMTP_HOST')?.trim();
  const portRaw = get('SMTP_PORT')?.trim();
  const user = get('SMTP_USER')?.trim();
  const password = get('SMTP_PASSWORD')?.trim();
  const from = get('SMTP_FROM')?.trim();
  const missing: string[] = [];
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!password) missing.push('SMTP_PASSWORD');
  const port = portRaw ? Number(portRaw) : 587;
  const secure = get('SMTP_SECURE')?.trim() === 'true' || port === 465;
  return {
    configured: missing.length === 0,
    missing,
    host: host || undefined,
    port: Number.isFinite(port) ? port : 587,
    user: user || undefined,
    from: from || undefined,
    secure,
    passwordPresent: Boolean(password),
    portPresent: Boolean(portRaw),
  };
}

export function gmailAuthFailureHint(category: SmtpErrorCategory): string | undefined {
  if (category === 'invalid_credentials' || category === 'auth_rejected') {
    return (
      'Gmail SMTP auth rejected — use an App Password (not your login password), enable 2FA, ' +
      'and confirm SMTP_USER matches the Google account.'
    );
  }
  return undefined;
}

export function classifySmtpError(err: unknown): {
  category: SmtpErrorCategory;
  message: string;
  hint?: string;
} {
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown SMTP error';
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: string }).code)
      : undefined;
  const response =
    err && typeof err === 'object' && 'response' in err
      ? String((err as { response?: string }).response)
      : undefined;
  const combined = `${message} ${code ?? ''} ${response ?? ''}`.toLowerCase();

  if (/missing|not configured|smtp_host|smtp_user|smtp_password/.test(combined)) {
    return {
      category: 'missing_env',
      message,
      hint: 'Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in the API environment.',
    };
  }
  if (
    /invalid login|username and password|authentication failed|535|534|auth|credentials|eauth/.test(
      combined,
    )
  ) {
    return {
      category: 'invalid_credentials',
      message,
      hint: 'Check SMTP_USER and SMTP_PASSWORD (Gmail requires an App Password with 2FA enabled).',
    };
  }
  if (/rejected|not allowed|550|553|554|sender/.test(combined)) {
    return {
      category: /recipient|rcpt|550 5\.1\.1/.test(combined) ? 'recipient_rejected' : 'sender_rejected',
      message,
      hint: 'Confirm SMTP_FROM is authorized for the mailbox (support@onlineceunits.com).',
    };
  }
  if (/etimedout|timeout|timed out|esocket/.test(combined)) {
    return {
      category: 'connection_timeout',
      message,
      hint: 'Verify SMTP_HOST and SMTP_PORT (Gmail: smtp.gmail.com:587 with STARTTLS).',
    };
  }
  if (/econnrefused|enotfound|getaddrinfo|connection refused|unable to connect/.test(combined)) {
    return {
      category: 'connection_refused',
      message,
      hint: 'Check network/firewall access to the SMTP host.',
    };
  }
  if (/tls|ssl|certificate|starttls/.test(combined)) {
    return {
      category: 'tls_error',
      message,
      hint: 'For Gmail on port 587 use STARTTLS (SMTP_SECURE=false, SMTP_PORT=587).',
    };
  }
  if (/535|authentication unsuccessful|auth rejected/.test(combined)) {
    return {
      category: 'auth_rejected',
      message,
      hint: 'SMTP authentication was rejected by the provider.',
    };
  }

  return { category: 'unknown', message };
}

export function formatSmtpErrorLog(category: SmtpErrorCategory, message: string, hint?: string): string {
  const label = category.replace(/_/g, ' ');
  return hint ? `[smtp:${label}] ${message} — ${hint}` : `[smtp:${label}] ${message}`;
}
