/**
 * Formats CE hours for regulator-friendly certificate display.
 *
 * @example formatCeHours(1)   → "1 Online Continuing Education Hour (Equivalent to 1 CE Unit)"
 * @example formatCeHours(2)   → "2 Online Continuing Education Hours (Equivalent to 2 CE Units)"
 * @example formatCeHours(1.0) → "1.0 Online CE Hour (Equivalent to 1.0 CE Unit)"
 * @example formatCeHours(1.5) → "1.5 Online CE Hours (Equivalent to 1.5 CE Units)"
 */
export function formatCeHours(hours: number | string): string {
  const raw = String(hours).trim();
  const numeric = Number(raw);

  if (Number.isNaN(numeric)) {
    return raw;
  }

  const hasExplicitDecimal = raw.includes('.');
  const isWholeValue = Number.isInteger(numeric) && !hasExplicitDecimal;

  if (isWholeValue) {
    const whole = Math.trunc(numeric);
    return whole === 1
      ? '1 Online Continuing Education Hour (Equivalent to 1 CE Unit)'
      : `${whole} Online Continuing Education Hours (Equivalent to ${whole} CE Units)`;
  }

  const formatted = numeric.toFixed(1);
  const parsed = Number(formatted);
  return parsed === 1
    ? '1.0 Online CE Hour (Equivalent to 1.0 CE Unit)'
    : `${formatted} Online CE Hours (Equivalent to ${formatted} CE Units)`;
}
