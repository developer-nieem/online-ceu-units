import type { LucideIcon } from 'lucide-react';

import { CNA_NETWORK_RENEWAL_URL } from './cna-network';
import {
  Award,
  BookOpen,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Bell,
  ScrollText,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const LEARNER_NAV: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Account', href: '/account/profile', icon: UserCircle },
  { title: 'Notifications', href: '/notifications', icon: Bell },
  { title: 'Courses', href: '/courses', icon: BookOpen, description: 'CEU catalog' },
  { title: 'Certificates', href: '/certificates', icon: Award },
  { title: 'Transcript', href: '/transcript', icon: ScrollText },
  { title: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { title: 'Billing', href: '/billing', icon: CreditCard },
  { title: 'Support', href: '/support', icon: LifeBuoy },
];

export type ResourceLink = {
  title: string;
  href: string;
  description: string;
  external?: boolean;
};

export const RESOURCE_LINKS: ResourceLink[] = [
  {
    title: 'CDPH Forms & Resources',
    href: 'https://www.cdph.ca.gov/Programs/CHCQ/LNC/CNA/Pages/Home.aspx',
    description: 'California Department of Public Health CNA resources',
    external: true,
  },
  {
    title: 'In-Person CEUs',
    href: '/resources#in-person',
    description: 'Classroom and skills sessions (placeholder)',
  },
  {
    title: 'CNA Program',
    href: '/resources#cna-program',
    description: 'Initial certification program information',
  },
  {
    title: 'Jobs Board',
    href: '/resources#jobs',
    description: 'CNA employment opportunities',
  },
  {
    title: 'CNA Network community',
    href: CNA_NETWORK_RENEWAL_URL,
    description: 'Renewal community hub on CNA Network',
    external: true,
  },
  {
    title: 'FAQ',
    href: '/resources#faq',
    description: 'Renewal, CEU, and platform questions',
  },
  {
    title: 'Blog & Resources',
    href: '/resources#blog',
    description: 'Articles, guides, and renewal tips',
  },
];

export const COMMUNITY_NAV: NavItem[] = [
  { title: 'Resources', href: '/resources', icon: Link2 },
  { title: 'Community', href: '/community', icon: Users },
  { title: 'Help & FAQ', href: '/resources#faq', icon: HelpCircle },
];
