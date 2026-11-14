'use client';

import { Button } from '@calace/ui/components/ui/button';
import { useRouter } from 'next/navigation';

import { logout } from '@/lib/auth';

export function DashboardLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
      Sign out
    </Button>
  );
}
