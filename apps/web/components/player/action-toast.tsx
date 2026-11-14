'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

export function ActionToast({
  message,
  variant = 'error',
  onDismiss,
}: {
  message: string;
  variant?: 'error' | 'success';
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const styles =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-950'
      : 'border-emerald-200 bg-emerald-50 text-emerald-950';

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm"
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="assertive"
    >
      <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ${styles}`}>
        {variant === 'error' ? (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        )}
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{message}</p>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
