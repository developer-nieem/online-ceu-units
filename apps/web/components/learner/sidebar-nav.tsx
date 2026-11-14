'use client';

import { cn } from '@calace/ui/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { COMMUNITY_NAV, LEARNER_NAV } from '@/lib/navigation';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <nav className="flex flex-col gap-6" aria-label="Learner navigation">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Learning
        </p>
        {LEARNER_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resources
        </p>
        {COMMUNITY_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
