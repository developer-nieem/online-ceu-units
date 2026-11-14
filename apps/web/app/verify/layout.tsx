import Link from 'next/link';

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-teal-800">
            CAL ACE Nursing Academy
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Learner sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-muted-foreground sm:px-6">
        Employer certificate verification — account, email, and transcript data are never shown.
      </footer>
    </div>
  );
}
