import {
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  DomainKind,
  PrismaClient,
  ProviderApprovalStatus,
  RoleScope,
  TenantStatus,
  UserStatus,
} from '@prisma/client';

import {
  CHAIN_OF_INFECTION_LESSON,
  RECOGNIZING_EARLY_SIGNS_LESSON,
} from '@calace/content-blocks';
import { DEFAULT_LAUNCH_CEU_HOURS } from '../src/ceu-defaults';
import {
  assertLaunchCatalogSeeds,
  mergeLaunchCatalogData,
  resolveLaunchCeHours,
} from '../src/launch-catalog';
import { backfillCeuHoursFromCourseVersions } from './backfill-ceu-hours';
import { normalizeLaunchCatalog } from './normalize-launch-catalog';
import { seedFinalExamForCourse } from './seed-assessments';
import { buildLessonContent, contentTypeForLessonIndex } from './seed-content';
import {
  DEV_SEED_ADMIN_EMAIL,
  DEV_SEED_INSTRUCTOR_EMAIL,
  DEV_SEED_STAFF_PASSWORD,
  isDevSeedContext,
  seedDevStaffUsers,
} from './seed-dev-auth';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const DOMAIN_HOSTNAME = 'onlineceunits.com';
const LEGACY_DOMAIN_HOSTNAME = 'renewal.cna.school';
const JURISDICTION_CODE = 'US-CA';
const PROFESSION_CODE = 'CNA';

const PERMISSIONS = [
  { resource: 'tenant', action: 'read' },
  { resource: 'tenant', action: 'manage' },
  { resource: 'user', action: 'read' },
  { resource: 'user', action: 'manage' },
  { resource: 'course', action: 'read' },
  { resource: 'course', action: 'manage' },
  { resource: 'enrollment', action: 'read' },
  { resource: 'enrollment', action: 'manage' },
  { resource: 'compliance', action: 'read' },
  { resource: 'compliance', action: 'manage' },
  { resource: 'certificate', action: 'issue' },
  { resource: 'audit', action: 'read' },
] as const;

const COURSE_CATEGORIES = [
  {
    slug: 'cna-renewal',
    name: 'CNA Renewal',
    description: 'Continuing education for certified nursing assistant license renewal.',
    sortOrder: 1,
  },
  {
    slug: 'infection-control',
    name: 'Infection Control',
    description: 'Mandatory infection prevention and control topics.',
    sortOrder: 2,
  },
  {
    slug: 'elder-abuse',
    name: 'Elder Abuse Prevention',
    description: 'Recognition and reporting of elder and dependent adult abuse.',
    sortOrder: 3,
  },
  {
    slug: 'professional-development',
    name: 'Professional Development',
    description: 'General skills and workplace professionalism for CNAs.',
    sortOrder: 4,
  },
] as const;

const DEFAULT_COMPLIANCE = {
  providerName: 'CAL ACE Nursing Academy',
  cdphApprovalStatus: 'placeholder' as const,
  targetAudience: 'California certified nursing assistants',
  requiredSeatTimeMinutes: 50,
  onlineDeliveryDesignation: 'online' as const,
};

/** Launch catalog: omit `ceHours` to use DEFAULT_LAUNCH_CEU_HOURS (1). Set explicitly for multi-hour courses. */
const SAMPLE_COURSES = [
  {
    slug: 'dementia-care',
    title: 'Dementia Care for Nursing Assistants',
    summary:
      'Person-centered approaches to bathing, nutrition, wandering, and behavioral support for residents with dementia.',
    categorySlug: 'professional-development',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'intermediate',
      instructor: 'James Okonkwo, LVN',
      featured: true,
      hasFreePreview: true,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'Build practical skills for supporting residents with Alzheimer’s disease and related dementias in long-term care settings.',
      learningObjectives: [
        'Apply person-centered communication during care activities',
        'Identify triggers for responsive behaviors',
        'Document dementia-related care observations accurately',
      ],
      imageAccent: 'violet',
      faq: [
        {
          question: 'Is this course California-approved?',
          answer:
            'This course awards 1 Online CE hour when you complete all requirements and pass the final exam.',
        },
      ],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'understanding-dementia',
        title: 'Understanding Dementia',
        lessons: [
          {
            slug: 'recognizing-early-signs',
            title: 'Recognizing Early Signs of Cognitive Decline',
            durationMinutes: 35,
            content: RECOGNIZING_EARLY_SIGNS_LESSON,
          },
          { slug: 'types-and-stages', title: 'Types and stages of dementia', durationMinutes: 20 },
          { slug: 'person-centered-care', title: 'Person-centered care principles', durationMinutes: 25 },
        ],
      },
      {
        slug: 'daily-care',
        title: 'Daily Care Skills',
        lessons: [
          { slug: 'bathing-and-hygiene', title: 'Bathing and hygiene strategies', durationMinutes: 30 },
          { slug: 'nutrition-support', title: 'Nutrition and hydration support', durationMinutes: 20 },
        ],
      },
      {
        slug: 'assessment',
        title: 'Course Assessment',
        lessons: [
          { slug: 'knowledge-check', title: 'Knowledge check', durationMinutes: 15 },
        ],
      },
    ],
  },
  {
    slug: 'infection-control',
    title: 'Infection Control for CNAs',
    summary:
      'Mandatory infection prevention, hand hygiene, PPE, and outbreak response for California nursing assistants.',
    categorySlug: 'infection-control',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'beginner',
      instructor: 'CAL ACE Faculty',
      featured: true,
      hasFreePreview: true,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'Meet California CNA infection control CEU requirements with practical protocols used in skilled nursing facilities.',
      learningObjectives: [
        'Perform proper hand hygiene and PPE donning/doffing',
        'Follow transmission-based precautions',
        'Respond to exposure incidents per facility policy',
      ],
      imageAccent: 'teal',
      faq: [
        {
          question: 'Does this satisfy mandatory infection control hours?',
          answer: 'Designed to align with California CNA mandatory topic requirements (placeholder).',
        },
      ],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'prevention-basics',
        title: 'Prevention Basics',
        lessons: [
          {
            slug: 'chain-of-infection',
            title: 'Chain of infection',
            durationMinutes: 25,
            content: CHAIN_OF_INFECTION_LESSON,
          },
          { slug: 'hand-hygiene', title: 'Hand hygiene in practice', durationMinutes: 20 },
        ],
      },
      {
        slug: 'ppe-and-precautions',
        title: 'PPE & Precautions',
        lessons: [
          { slug: 'ppe-selection', title: 'PPE selection and use', durationMinutes: 30 },
          { slug: 'isolation-precautions', title: 'Isolation precautions', durationMinutes: 25 },
        ],
      },
      {
        slug: 'assessment',
        title: 'Final Review',
        lessons: [{ slug: 'final-quiz', title: 'Infection control quiz', durationMinutes: 20 }],
      },
    ],
  },
  {
    slug: 'elder-abuse-reporting',
    title: 'Elder & Dependent Adult Abuse Reporting',
    summary:
      'Recognize signs of abuse and neglect and meet California mandatory reporting obligations for CNAs.',
    categorySlug: 'elder-abuse',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'beginner',
      instructor: 'CAL ACE Faculty',
      featured: true,
      hasFreePreview: true,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'California-required elder and dependent adult abuse recognition, documentation, and reporting for nursing assistants.',
      learningObjectives: [
        'Identify physical, emotional, and financial abuse indicators',
        'Follow facility and state mandatory reporting timelines',
        'Document observations without compromising resident safety',
      ],
      imageAccent: 'orange',
      faq: [],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'recognition',
        title: 'Recognition',
        lessons: [
          { slug: 'types-of-abuse', title: 'Types of abuse and neglect', durationMinutes: 25 },
          { slug: 'risk-factors', title: 'Resident risk factors', durationMinutes: 20 },
        ],
      },
      {
        slug: 'reporting',
        title: 'Reporting',
        lessons: [
          { slug: 'mandatory-reporting', title: 'Mandatory reporting in California', durationMinutes: 25 },
          { slug: 'documentation', title: 'Documentation essentials', durationMinutes: 20 },
        ],
      },
      {
        slug: 'assessment',
        title: 'Course Assessment',
        lessons: [{ slug: 'reporting-quiz', title: 'Reporting knowledge check', durationMinutes: 15 }],
      },
    ],
  },
  {
    slug: 'resident-rights',
    title: 'Resident Rights & Advocacy',
    summary:
      'Federal and California resident rights, informed consent, privacy, and CNA advocacy responsibilities.',
    categorySlug: 'cna-renewal',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'beginner',
      instructor: 'Dr. Maria Chen, RN',
      featured: true,
      hasFreePreview: true,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'Understand the rights of long-term care residents and your role in upholding dignity and choice.',
      learningObjectives: [
        'Explain key federal resident rights regulations',
        'Recognize violations and mandatory reporting pathways',
        'Support resident self-determination in daily care',
      ],
      imageAccent: 'blue',
      faq: [],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'rights-foundation',
        title: 'Rights Foundation',
        lessons: [
          { slug: 'federal-rights', title: 'Federal resident rights overview', durationMinutes: 25 },
          { slug: 'california-requirements', title: 'California-specific requirements', durationMinutes: 20 },
        ],
      },
      {
        slug: 'advocacy',
        title: 'CNA Advocacy',
        lessons: [
          { slug: 'privacy-and-dignity', title: 'Privacy and dignity', durationMinutes: 25 },
          { slug: 'quiz', title: 'Rights knowledge check', durationMinutes: 20 },
        ],
      },
    ],
  },
  {
    slug: 'mobility-safety',
    title: 'Mobility & Transfer Safety',
    summary:
      'Safe transfers, fall prevention, assistive devices, and body mechanics for nursing assistants.',
    categorySlug: 'professional-development',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'beginner',
      instructor: 'CAL ACE Faculty',
      featured: false,
      hasFreePreview: true,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'Reduce injury risk for residents and staff through evidence-based mobility and transfer techniques.',
      learningObjectives: [
        'Apply safe body mechanics during lifts and transfers',
        'Use assistive devices appropriately',
        'Implement fall-prevention strategies',
      ],
      imageAccent: 'amber',
      faq: [],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'body-mechanics',
        title: 'Body Mechanics',
        lessons: [
          { slug: 'ergonomics', title: 'CNA ergonomics fundamentals', durationMinutes: 20 },
          { slug: 'transfer-techniques', title: 'Transfer techniques', durationMinutes: 30 },
        ],
      },
      {
        slug: 'fall-prevention',
        title: 'Fall Prevention',
        lessons: [
          { slug: 'risk-factors', title: 'Fall risk factors', durationMinutes: 20 },
          { slug: 'prevention-plan', title: 'Prevention planning', durationMinutes: 15 },
        ],
      },
    ],
  },
  {
    slug: 'stress-management',
    title: 'Stress Management for Healthcare Workers',
    summary:
      'Burnout awareness, coping strategies, and resilience skills tailored to CNA workloads.',
    categorySlug: 'professional-development',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'beginner',
      instructor: 'Dr. Maria Chen, RN',
      featured: false,
      hasFreePreview: false,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'Protect your well-being while delivering compassionate care with practical stress-reduction tools.',
      learningObjectives: [
        'Identify signs of caregiver stress and burnout',
        'Apply brief mindfulness and grounding techniques',
        'Access workplace support resources',
      ],
      imageAccent: 'emerald',
      faq: [],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'awareness',
        title: 'Stress Awareness',
        lessons: [
          { slug: 'burnout-signs', title: 'Recognizing burnout', durationMinutes: 20 },
          { slug: 'coping-tools', title: 'Coping tools for shifts', durationMinutes: 25 },
        ],
      },
      {
        slug: 'resilience',
        title: 'Building Resilience',
        lessons: [{ slug: 'reflection', title: 'Reflection and action plan', durationMinutes: 15 }],
      },
    ],
  },
  {
    slug: 'communication-skills',
    title: 'Communication Skills in Long-Term Care',
    summary:
      'Therapeutic communication, handoffs, family interactions, and team collaboration for CNAs.',
    categorySlug: 'professional-development',
    catalogData: {
      price: 3.75,
      durationMinutes: 60,
      difficulty: 'intermediate',
      instructor: 'Dr. Maria Chen, RN',
      featured: true,
      hasFreePreview: true,
      subscriptionEligible: true,
    },
    contentMeta: {
      overview:
        'Strengthen verbal and nonverbal communication with residents, families, and interdisciplinary teams.',
      learningObjectives: [
        'Use therapeutic communication techniques',
        'Conduct effective shift handoffs',
        'Navigate difficult conversations with empathy',
      ],
      imageAccent: 'rose',
      faq: [],
      compliance: DEFAULT_COMPLIANCE,
    },
    modules: [
      {
        slug: 'therapeutic-comm',
        title: 'Therapeutic Communication',
        lessons: [
          { slug: 'active-listening', title: 'Active listening skills', durationMinutes: 20 },
          { slug: 'nonverbal-cues', title: 'Nonverbal communication', durationMinutes: 20 },
        ],
      },
      {
        slug: 'team-comm',
        title: 'Team Communication',
        lessons: [
          { slug: 'handoffs', title: 'Shift handoffs', durationMinutes: 20 },
          { slug: 'family-interactions', title: 'Family interactions', durationMinutes: 15 },
        ],
      },
    ],
  },
] as const;

async function seedCourseModules(
  courseVersionId: string,
  modules: (typeof SAMPLE_COURSES)[number]['modules'],
) {
  let moduleOrder = 0;
  for (const mod of modules) {
    const module = await prisma.module.upsert({
      where: {
        courseVersionId_slug: { courseVersionId, slug: mod.slug },
      },
      create: {
        courseVersionId,
        slug: mod.slug,
        title: mod.title,
        sortOrder: moduleOrder++,
        status: ContentPublishStatus.PUBLISHED,
      },
      update: {
        title: mod.title,
        sortOrder: moduleOrder - 1,
        status: ContentPublishStatus.PUBLISHED,
      },
    });

    let lessonOrder = 0;
    for (const lesson of mod.lessons) {
      const globalIndex = moduleOrder * 10 + lessonOrder;
      const contentType = contentTypeForLessonIndex(globalIndex);
      const content =
        'content' in lesson && lesson.content
          ? lesson.content
          : buildLessonContent(contentType, lesson.title);

      await prisma.lesson.upsert({
        where: {
          moduleId_slug: { moduleId: module.id, slug: lesson.slug },
        },
        create: {
          moduleId: module.id,
          slug: lesson.slug,
          title: lesson.title,
          sortOrder: lessonOrder++,
          status: ContentPublishStatus.PUBLISHED,
          durationMinutes: lesson.durationMinutes,
          content,
        },
        update: {
          title: lesson.title,
          sortOrder: lessonOrder - 1,
          status: ContentPublishStatus.PUBLISHED,
          durationMinutes: lesson.durationMinutes,
          content,
        },
      });
    }
  }
}

async function seedPermissions() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        resource_action: { resource: perm.resource, action: perm.action },
      },
      create: { resource: perm.resource, action: perm.action },
      update: {},
    });
  }
}

async function main() {
  console.log('Seeding CAL ACE LMS foundation...');

  await seedPermissions();

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    create: {
      slug: TENANT_SLUG,
      name: 'CAL ACE Nursing Academy',
      status: TenantStatus.ACTIVE,
      settings: {
        brand: 'CAL ACE',
        supportEmail: 'support@calace.org',
        defaultLocale: 'en-US',
        providerCompliance: {
          providerName: 'CAL ACE Nursing Academy',
          nacProviderReference: 'NAC-7384',
          providerContactEmail: 'support@onlineceunits.com',
          providerContactPhone: '(408) 256-0763',
          providerContactAddress: '1535 Landess Ave., Suite 103, Milpitas, CA 95035',
          supportContactEmail: 'support@onlineceunits.com',
          supportContactUrl: '/support',
          recordRetentionPolicyText:
            'Completion records, exam attempts, participation data, and certificates are retained per organizational policy.',
          certificateWordingTemplate: '{{hours}} Online CE hour(s)',
          attestationText:
            'I attest that I personally completed this online continuing education course, participated actively as required, and that the name on this certificate is correct.',
          showApprovalStatusToLearners: false,
          courseApprovalStatusLabel: 'Pending CDPH online approval',
          defaultInstructorName: 'CAL ACE Instructional Team',
          defaultCeHoursPerCourse: 1,
          minutesPerOnlineCeuHour: 50,
          internalAuditExportNote:
            'State audit exports are internal/admin only — not exposed in the learner portal.',
        },
      },
      metadata: {
        legalName: 'CAL ACE Nursing Academy',
        product: 'renewal-cna-school',
      },
    },
    update: {
      name: 'CAL ACE Nursing Academy',
      status: TenantStatus.ACTIVE,
    },
  });

  const tenantSettings = (tenant.settings ?? {}) as Record<string, unknown>;
  const providerCompliance = {
    ...((typeof tenantSettings.providerCompliance === 'object' &&
    tenantSettings.providerCompliance !== null
      ? tenantSettings.providerCompliance
      : {}) as Record<string, unknown>),
    providerContactAddress: '1535 Landess Ave., Suite 103, Milpitas, CA 95035',
  };
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      settings: {
        ...tenantSettings,
        providerCompliance,
      },
    },
  });

  const legacyDomain = await prisma.domain.findUnique({
    where: { hostname: LEGACY_DOMAIN_HOSTNAME },
  });
  const primaryDomain = await prisma.domain.findUnique({
    where: { hostname: DOMAIN_HOSTNAME },
  });

  if (legacyDomain && !primaryDomain) {
    await prisma.domain.update({
      where: { id: legacyDomain.id },
      data: {
        hostname: DOMAIN_HOSTNAME,
        kind: DomainKind.PRIMARY,
        isVerified: true,
        isPrimary: true,
        tenantId: tenant.id,
      },
    });
  } else {
    if (legacyDomain && primaryDomain) {
      await prisma.domain.delete({ where: { id: legacyDomain.id } });
    }
    await prisma.domain.upsert({
      where: { hostname: DOMAIN_HOSTNAME },
      create: {
        tenantId: tenant.id,
        hostname: DOMAIN_HOSTNAME,
        kind: DomainKind.PRIMARY,
        isVerified: true,
        isPrimary: true,
        metadata: { environment: 'development' },
      },
      update: {
        tenantId: tenant.id,
        isPrimary: true,
        isVerified: true,
      },
    });
  }

  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { code: JURISDICTION_CODE },
    create: {
      code: JURISDICTION_CODE,
      name: 'California',
      country: 'US',
      region: 'CA',
      metadata: {
        regulatoryNotes: 'California CDPH / BRN CE requirements apply by profession.',
      },
    },
    update: { name: 'California' },
  });

  const profession = await prisma.profession.upsert({
    where: {
      jurisdictionId_code: {
        jurisdictionId: jurisdiction.id,
        code: PROFESSION_CODE,
      },
    },
    create: {
      jurisdictionId: jurisdiction.id,
      code: PROFESSION_CODE,
      name: 'Certified Nursing Assistant',
      description: 'California CNA certification and renewal.',
      metadata: { licenseType: 'CNA' },
    },
    update: { name: 'Certified Nursing Assistant' },
  });

  await prisma.providerApproval.upsert({
    where: { id: 'seed-cdph-provider-approval' },
    create: {
      id: 'seed-cdph-provider-approval',
      tenantId: tenant.id,
      jurisdictionId: jurisdiction.id,
      professionId: profession.id,
      approvingBody: 'California Department of Public Health (CDPH)',
      approvalNumber: 'CDPH-CE-PLACEHOLDER',
      status: ProviderApprovalStatus.PENDING,
      effectiveFrom: new Date('2026-01-01'),
      ceHoursApproved: 48,
      metadata: {
        note: 'Replace with verified CDPH provider approval number before production.',
        placeholder: true,
      },
    },
    update: {
      tenantId: tenant.id,
      jurisdictionId: jurisdiction.id,
      professionId: profession.id,
      status: ProviderApprovalStatus.PENDING,
    },
  });

  await prisma.complianceRuleSet.upsert({
    where: { id: 'seed-ca-cna-compliance-v1' },
    create: {
      id: 'seed-ca-cna-compliance-v1',
      tenantId: tenant.id,
      jurisdictionId: jurisdiction.id,
      professionId: profession.id,
      name: 'California CNA Renewal — Baseline',
      version: '1.0',
      effectiveFrom: new Date('2026-01-01'),
      rules: {
        renewalPeriodMonths: 24,
        requiredCeHours: 48,
        minHoursPerYear: 12,
        maxOnlineHours: 24,
        mandatoryTopics: ['infection-control', 'elder-abuse'],
        documentationRequired: true,
      },
      metadata: { placeholder: true },
    },
    update: {
      tenantId: tenant.id,
      jurisdictionId: jurisdiction.id,
      professionId: profession.id,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'admin' },
    },
    create: {
      tenantId: tenant.id,
      slug: 'admin',
      name: 'Administrator',
      description: 'Full tenant administration access.',
      scope: RoleScope.TENANT,
      isSystem: true,
    },
    update: {},
  });

  const learnerRole = await prisma.role.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'learner' },
    },
    create: {
      tenantId: tenant.id,
      slug: 'learner',
      name: 'Learner',
      description: 'Standard learner access.',
      scope: RoleScope.TENANT,
      isSystem: true,
    },
    update: {},
  });

  const instructorRole = await prisma.role.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'instructor' },
    },
    create: {
      tenantId: tenant.id,
      slug: 'instructor',
      name: 'Instructor',
      description: 'Course authoring and learner oversight.',
      scope: RoleScope.TENANT,
      isSystem: true,
    },
    update: {},
  });

  const supportRole = await prisma.role.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'support' },
    },
    create: {
      tenantId: tenant.id,
      slug: 'support',
      name: 'Support Staff',
      description: 'Customer support and ticket management.',
      scope: RoleScope.TENANT,
      isSystem: true,
    },
    update: {},
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: adminRole.id, permissionId: permission.id },
      update: {},
    });
  }

  const readPermissions = allPermissions.filter(
    (p) => p.action === 'read' || p.resource === 'enrollment',
  );
  for (const permission of readPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: learnerRole.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: learnerRole.id, permissionId: permission.id },
      update: {},
    });
  }

  const instructorPermissions = allPermissions.filter(
    (p) =>
      ['course', 'enrollment', 'user'].includes(p.resource) &&
      ['read', 'manage'].includes(p.action),
  );
  for (const permission of instructorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: instructorRole.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: instructorRole.id, permissionId: permission.id },
      update: {},
    });
  }

  const supportPermissions = allPermissions.filter(
    (p) => ['user', 'enrollment', 'audit'].includes(p.resource) && p.action === 'read',
  );
  for (const permission of supportPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: supportRole.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: supportRole.id, permissionId: permission.id },
      update: {},
    });
  }

  // Staff users: admin + instructor — dev password SuccesS8@8 (see seed-dev-auth.ts)
  await seedDevStaffUsers(prisma, {
    tenantId: tenant.id,
    jurisdictionId: jurisdiction.id,
    professionId: profession.id,
    roleIds: { admin: adminRole.id, instructor: instructorRole.id },
  });

  const categoryBySlug: Record<string, string> = {};

  for (const category of COURSE_CATEGORIES) {
    const record = await prisma.courseCategory.upsert({
      where: {
        tenantId_slug: { tenantId: tenant.id, slug: category.slug },
      },
      create: {
        tenantId: tenant.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        metadata: { placeholder: true },
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      },
    });
    categoryBySlug[category.slug] = record.id;
  }

  assertLaunchCatalogSeeds(SAMPLE_COURSES);

  for (const sample of SAMPLE_COURSES) {
    const ceHours = resolveLaunchCeHours((sample as { ceHours?: number }).ceHours);
    const catalogData = mergeLaunchCatalogData(sample.catalogData, ceHours);

    const course = await prisma.course.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: sample.slug } },
      create: {
        tenantId: tenant.id,
        categoryId: categoryBySlug[sample.categorySlug],
        professionId: profession.id,
        slug: sample.slug,
        title: sample.title,
        summary: sample.summary,
        status: CourseStatus.PUBLISHED,
        ceHours,
        catalogData,
      },
      update: {
        title: sample.title,
        summary: sample.summary,
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
        ceHours,
        catalogData,
        categoryId: categoryBySlug[sample.categorySlug],
      },
    });

    const version = await prisma.courseVersion.upsert({
      where: {
        courseId_versionNumber: { courseId: course.id, versionNumber: 1 },
      },
      create: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Initial release',
        status: CourseVersionStatus.PUBLISHED,
        ceHours,
        publishedAt: new Date(),
        contentMeta: sample.contentMeta,
      },
      update: {
        status: CourseVersionStatus.PUBLISHED,
        ceHours,
        publishedAt: new Date(),
        contentMeta: sample.contentMeta,
      },
    });

    await seedCourseModules(version.id, sample.modules);
    await seedFinalExamForCourse(prisma, version.id, sample.slug);
  }

  const normalized = await normalizeLaunchCatalog(prisma, TENANT_SLUG);
  if (
    normalized.coursesNormalized > 0 ||
    normalized.versionsNormalized > 0 ||
    normalized.coursesArchived > 0
  ) {
    console.log('  Launch catalog normalize:', normalized);
  }

  const backfill = await backfillCeuHoursFromCourseVersions();
  if (
    backfill.completionsUpdated > 0 ||
    backfill.certificatesUpdated > 0 ||
    backfill.transcriptsUpdated > 0
  ) {
    console.log('  CE hours backfill:', backfill);
  }

  const { seedCmsCourses } = await import('./seed-courses');
  const courseCount = await seedCmsCourses(prisma, tenant.id, profession.id);

  const { seedDemoEnrollments, seedDemoLearner } = await import('./seed-enrollments');
  const demoLearnerId = await seedDemoLearner(
    prisma,
    tenant.id,
    learnerRole.id,
    jurisdiction.id,
    profession.id,
  );
  const enrollmentCount = await seedDemoEnrollments(prisma, tenant.id, demoLearnerId);

  console.log('Seed complete.');
  console.log(`  Tenant:       ${tenant.slug} (${tenant.id})`);
  console.log(`  Domain:       ${DOMAIN_HOSTNAME}`);
  console.log(`  Jurisdiction: ${JURISDICTION_CODE}`);
  console.log(`  Profession:   ${PROFESSION_CODE}`);
  if (isDevSeedContext()) {
    console.log(`  Dev admin:      ${DEV_SEED_ADMIN_EMAIL} / ${DEV_SEED_STAFF_PASSWORD}`);
    console.log(`  Dev instructor: ${DEV_SEED_INSTRUCTOR_EMAIL} / ${DEV_SEED_STAFF_PASSWORD}`);
  } else {
    console.log(`  Admin user:     ${DEV_SEED_ADMIN_EMAIL} (no default password — production seed)`);
  }

  console.log(`  Categories:   ${COURSE_CATEGORIES.length} course categories`);
  console.log(`  CMS courses:  ${courseCount} courses seeded`);
  console.log(`  Enrollments:  ${enrollmentCount} demo enrollments seeded`);
  console.log(`  Courses:      ${SAMPLE_COURSES.length} published catalog courses`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });