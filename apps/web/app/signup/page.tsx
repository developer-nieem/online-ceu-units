import { SignupForm } from '@/components/auth/signup-form';

type SignupPageProps = {
  searchParams: Promise<{ plan?: string; ref?: string; next?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { plan, ref, next } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <SignupForm
        nextPath={next}
        pendingPlan={
          plan === 'unlimited-1y' || plan === 'unlimited-2y' ? plan : undefined
        }
        referredByCode={ref?.trim().toUpperCase() || undefined}
      />
    </main>
  );
}