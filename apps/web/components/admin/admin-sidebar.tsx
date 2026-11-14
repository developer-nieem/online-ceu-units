'use client';

import {
  Activity,
  Award,
  BadgeCheck,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  CreditCard,
  Headphones,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/learners', label: 'Learners', icon: Users },
  { href: '/admin/students', label: 'Enrolled students', icon: GraduationCap },
  { href: '/admin/messaging', label: 'Messaging', icon: Mail },
  { href: '/cms', label: 'Courses', icon: BookOpen },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
  { href: '/admin/compliance', label: 'Compliance settings', icon: ShieldCheck },
  { href: '/admin/audit', label: 'Audit log', icon: ClipboardList },
  { href: '/admin/revenue', label: 'Revenue', icon: CreditCard },
  { href: '/admin/members/unlimited-1y', label: '1-Year Unlimited Members', icon: BadgeCheck },
  { href: '/admin/members/unlimited', label: '2-Year Unlimited Members', icon: BadgeCheck },
  { href: '/admin/support', label: 'Support', icon: Headphones },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 text-sm">
      <p className="flex items-center gap-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Activity className="h-3 w-3" aria-hidden />
        Operations
      </p>
      {NAV.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 ${
              active
                ? 'bg-slate-800 font-medium text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
