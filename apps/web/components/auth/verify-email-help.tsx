import { SUPPORT_EMAIL } from '@/lib/support';

export function VerifyEmailHelp() {
  return (
    <p className="text-sm text-muted-foreground">
      Need help? Contact{' '}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-teal-800 underline">
        {SUPPORT_EMAIL}
      </a>
      .
    </p>
  );
}
