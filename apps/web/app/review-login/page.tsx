type ReviewLoginPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function ReviewLoginPage({ searchParams }: ReviewLoginPageProps) {
  const { redirect, error } = await searchParams;
  const redirectPath = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-slate-900">
          CAL ACE — Restricted Preview
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter the reviewer password to continue.
        </p>

        <form action="/api/review-gate" method="post" className="mt-8 space-y-4">
          <input type="hidden" name="redirect" value={redirectPath} />
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {error === '1' ? (
            <p className="text-sm text-red-600" role="alert">
              Incorrect password
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
