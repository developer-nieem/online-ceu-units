export type DashboardLinkStatus = 'live' | 'placeholder';

export interface DashboardLink {
  title: string;
  description: string;
  href: string;
  status: DashboardLinkStatus;
}

export interface DashboardGroup {
  title: string;
  description: string;
  links: DashboardLink[];
}

export const LEARNER_DASHBOARD_GROUPS: DashboardGroup[] = [
  {
    title: 'Learning',
    description: 'Enroll, continue, and review your continuing education courses.',
    links: [
      {
        title: 'Browse Courses',
        description: 'Explore state-aligned online CE courses for CNA renewal.',
        href: '/courses',
        status: 'live',
      },
      {
        title: 'Active Courses',
        description: 'Resume in-progress enrollments and track completion progress.',
        href: '/courses/active',
        status: 'live',
      },
      {
        title: 'Completed Courses',
        description: 'Review finished courses and access completion records.',
        href: '/courses/completed',
        status: 'live',
      },
      {
        title: 'Course Catalog',
        description: 'Full catalog with course descriptions and CE Unit details.',
        href: '/courses',
        status: 'live',
      },
      {
        title: 'Course Details',
        description: 'View syllabus, CE Units, and enrollment options for a sample course.',
        href: '/courses/infection-control',
        status: 'live',
      },
    ],
  },
  {
    title: 'Certificates & Transcript',
    description: 'Official completion records for licensure and renewal documentation.',
    links: [
      {
        title: 'My Certificates',
        description: 'View and download CE completion certificates with certificate numbers.',
        href: '/certificates',
        status: 'live',
      },
      {
        title: 'My Transcript',
        description: 'Official transcript with chronological course history and CE Unit totals.',
        href: '/transcript',
        status: 'live',
      },
    ],
  },
  {
    title: 'Renewal & Compliance',
    description: 'California CNA renewal progress, guidance, and verification tools.',
    links: [
      {
        title: 'Renewal Guidance',
        description: 'California CE requirements, online limits, and CDPH resource links.',
        href: '/renewal-guidance',
        status: 'live',
      },
      {
        title: 'Verify a Certificate',
        description: 'Public lookup to confirm CE certificate issuance (limited metadata).',
        href: '/verify-certificate',
        status: 'live',
      },
    ],
  },
  {
    title: 'Resources & Support',
    description: 'Helpful guides, answers, and updates from CAL ACE Nursing Academy.',
    links: [
      {
        title: 'Resources',
        description: 'Renewal checklists, guides, and CNA continuing education support materials.',
        href: '/resources',
        status: 'live',
      },
      {
        title: 'FAQ',
        description: 'Answers to common questions about enrollment, CE Units, and renewal.',
        href: '/faq',
        status: 'live',
      },
      {
        title: 'Support',
        description: 'Contact support for enrollment, certificates, and account assistance.',
        href: '/support',
        status: 'live',
      },
      {
        title: 'Blog & Updates',
        description: 'News, regulatory updates, and educational announcements.',
        href: '/blog',
        status: 'placeholder',
      },
      {
        title: 'Pricing & Promotions',
        description: 'Current course pricing and available promotional offers.',
        href: '/pricing',
        status: 'placeholder',
      },
    ],
  },
  {
    title: 'Account',
    description: 'Profile, identity, and learner account preferences.',
    links: [
      {
        title: 'Account Profile',
        description: 'Locked identity, license information, and California renewal progress.',
        href: '/account/profile',
        status: 'live',
      },
      {
        title: 'Notifications',
        description: 'Enrollment confirmations, completion notices, and account alerts.',
        href: '/notifications',
        status: 'placeholder',
      },
    ],
  },
];
