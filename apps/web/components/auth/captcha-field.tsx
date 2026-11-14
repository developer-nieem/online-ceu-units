'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => void;
    };
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export type CaptchaFieldHandle = {
  getToken: () => Promise<string | undefined>;
};

const RECAPTCHA_SCRIPT_ID = 'recaptcha-v3-script';

export const CaptchaField = forwardRef<CaptchaFieldHandle, { action: string }>(
  function CaptchaField({ action }, ref) {
    const widgetRef = useRef<HTMLDivElement>(null);
    const turnstileToken = useRef<string | undefined>(undefined);
    const provider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER ?? 'none';
    const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useEffect(() => {
      if (provider === 'recaptcha' && recaptchaKey) {
        if (document.getElementById(RECAPTCHA_SCRIPT_ID)) return;
        const script = document.createElement('script');
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaKey)}`;
        script.async = true;
        document.head.appendChild(script);
        return;
      }

      if (provider === 'turnstile' && turnstileKey) {
        const el = widgetRef.current;
        if (!el) return;
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.onload = () => {
          window.turnstile?.render(el, {
            sitekey: turnstileKey,
            callback: (token) => {
              turnstileToken.current = token;
            },
          });
        };
        document.body.appendChild(script);
        return () => {
          script.remove();
        };
      }
    }, [provider, recaptchaKey, turnstileKey]);

    useImperativeHandle(ref, () => ({
      getToken: async () => {
        if (provider === 'none') return undefined;
        if (provider === 'turnstile') return turnstileToken.current;
        if (provider !== 'recaptcha' || !recaptchaKey) return undefined;

        const grecaptcha = window.grecaptcha;
        if (!grecaptcha?.execute) return undefined;
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('reCAPTCHA timed out')), 12_000);
          const done = () => {
            clearTimeout(timer);
            resolve();
          };
          if (grecaptcha.ready) grecaptcha.ready(done);
          else done();
        });
        return Promise.race([
          grecaptcha.execute(recaptchaKey, { action }),
          new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('reCAPTCHA timed out')), 12_000);
          }),
        ]);
      },
    }));

    if (provider === 'none') {
      return (
        <p className="text-xs text-muted-foreground">
          CAPTCHA disabled in development (set NEXT_PUBLIC_CAPTCHA_PROVIDER for production).
        </p>
      );
    }

    if (provider === 'recaptcha') {
      return (
        <p className="text-xs text-slate-500">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            className="underline"
            href="https://policies.google.com/privacy"
            rel="noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            className="underline"
            href="https://policies.google.com/terms"
            rel="noreferrer"
            target="_blank"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>
      );
    }

    return <div ref={widgetRef} />;
  },
);

CaptchaField.displayName = 'CaptchaField';
