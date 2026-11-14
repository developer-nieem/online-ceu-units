// packages/db/prisma/remap-course-categories.ts
// DATA-ONLY reclassification of the 50 catalog courses into CNA training categories.
// Touches Course.categoryId and CourseCategory rows ONLY. Never CourseVersion, never lesson content, never course status.
// Idempotent. DRY-RUN by default; pass --apply to write.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const CATEGORIES: { slug: string; name: string; sortOrder: number }[] = [
  { slug: 'medical-surgical', name: 'Medical-Surgical', sortOrder: 1 },
  { slug: 'common-geriatric-illnesses', name: 'Common Geriatric Illnesses', sortOrder: 2 },
  { slug: 'infection-control', name: 'Infection Control', sortOrder: 3 },
  { slug: 'patient-care-procedures', name: 'Patient Care and Procedures', sortOrder: 4 },
  { slug: 'resident-care', name: 'Resident Care', sortOrder: 5 },
  { slug: 'emergency-care', name: 'Emergency Care', sortOrder: 6 },
  { slug: 'body-mechanics', name: 'Body Mechanics', sortOrder: 7 },
  { slug: 'communication', name: 'Communication', sortOrder: 8 },
  { slug: 'dementia-care', name: 'Dementia and Dementia Care', sortOrder: 9 },
  { slug: 'patient-rights', name: 'Patient Rights', sortOrder: 10 },
  { slug: 'abuse-and-abuse-reporting', name: 'Abuse and Abuse Reporting', sortOrder: 11 },
  { slug: 'ethics', name: 'Ethics', sortOrder: 12 },
  { slug: 'safety', name: 'Safety', sortOrder: 13 },
  { slug: 'professional-development', name: 'Advancement/Professional Development', sortOrder: 14 },
];

// course slug -> category slug (50 courses)
const COURSE_CATEGORY: Record<string, string> = {
  'covid-respiratory-illness': 'infection-control',
  'hepatitis': 'infection-control',
  'hiv-aids': 'infection-control',
  'infection-control': 'infection-control',
  'mrsa-resistant-infections': 'infection-control',
  'tuberculosis': 'infection-control',
  'cardiac-emergency': 'emergency-care',
  'seizures-epilepsy': 'emergency-care',
  'stroke': 'emergency-care',
  'sepsis-recognition': 'medical-surgical',
  'asthma': 'medical-surgical',
  'chf-care': 'medical-surgical',
  'chronic-kidney-disease': 'medical-surgical',
  'copd': 'medical-surgical',
  'coronary-artery-disease': 'medical-surgical',
  'multiple-sclerosis': 'medical-surgical',
  'traumatic-brain-injury': 'medical-surgical',
  'spinal-cord-injury': 'medical-surgical',
  'alcohol-use-disorder': 'common-geriatric-illnesses',
  'anxiety-ptsd': 'common-geriatric-illnesses',
  'depression': 'common-geriatric-illnesses',
  'diabetes': 'common-geriatric-illnesses',
  'hypertension': 'common-geriatric-illnesses',
  'hypoglycemia-hyperglycemia': 'common-geriatric-illnesses',
  'osteoporosis': 'common-geriatric-illnesses',
  'thyroid-disorders': 'common-geriatric-illnesses',
  'parkinsons': 'common-geriatric-illnesses',
  'rheumatoid-arthritis': 'common-geriatric-illnesses',
  'pneumonia': 'common-geriatric-illnesses',
  'mobility-safety': 'body-mechanics',
  'joint-replacement': 'body-mechanics',
  'catheter-care-uti': 'patient-care-procedures',
  'ostomy-care': 'patient-care-procedures',
  'urinary-incontinence': 'patient-care-procedures',
  'pressure-injuries': 'patient-care-procedures',
  'wound-observation': 'patient-care-procedures',
  'dysphagia': 'patient-care-procedures',
  'bowel-health-constipation': 'patient-care-procedures',
  'malnutrition-elderly': 'resident-care',
  'pain-comfort': 'resident-care',
  'autism-in-adults': 'resident-care',
  'vision-impairment': 'resident-care',
  'communication-skills': 'communication',
  'hearing-impairment': 'communication',
  'dementia-care': 'dementia-care',
  'resident-rights': 'patient-rights',
  'elder-abuse-reporting': 'abuse-and-abuse-reporting',
  'legal-ethical-nursing-practice': 'ethics',
  'workplace-violence-prevention': 'safety',
  'stress-management': 'professional-development'
};

async function main() {
  console.log(APPLY ? '=== APPLY MODE (writing) ===' : '=== DRY RUN (no writes) ===');
  const slugs = Object.keys(COURSE_CATEGORY);

  const courses = await prisma.course.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, tenantId: true, categoryId: true },
  });
  const found = new Set(courses.map((c) => c.slug));
  const missing = slugs.filter((s) => !found.has(s));
  console.log(`Courses found: ${courses.length} / ${slugs.length}`);
  if (missing.length) console.warn('WARNING — not found (skipped):', missing);
  if (courses.length === 0) { console.error('No courses found — wrong DATABASE_URL? Aborting.'); process.exit(1); }

  const tenantIds = [...new Set(courses.map((c) => c.tenantId))];
  if (tenantIds.length !== 1) { console.error('Expected exactly 1 tenant, found:', tenantIds); process.exit(1); }
  const tenantId = tenantIds[0];

  const cvBefore = await prisma.courseVersion.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  console.log('CourseVersion baseline:', cvBefore._count._all, 'rows; max updatedAt', cvBefore._max.updatedAt);

  const idBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    if (APPLY) {
      const rec = await prisma.courseCategory.upsert({
        where: { tenantId_slug: { tenantId, slug: c.slug } },
        create: { tenantId, slug: c.slug, name: c.name, sortOrder: c.sortOrder },
        update: { name: c.name, sortOrder: c.sortOrder },
      });
      idBySlug[c.slug] = rec.id;
    } else {
      const rec = await prisma.courseCategory.findUnique({
        where: { tenantId_slug: { tenantId, slug: c.slug } },
        select: { id: true },
      });
      idBySlug[c.slug] = rec?.id ?? '(WOULD CREATE)';
      console.log(`category ${c.slug}: ${rec ? 'exists' : 'WOULD CREATE'} -> "${c.name}"`);
    }
  }

  let changed = 0;
  for (const course of courses) {
    const targetId = idBySlug[COURSE_CATEGORY[course.slug]];
    if (!APPLY) { console.log(`course ${course.slug} -> ${COURSE_CATEGORY[course.slug]}`); continue; }
    if (course.categoryId === targetId) continue;
    await prisma.course.update({ where: { id: course.id }, data: { categoryId: targetId } });
    changed++;
  }
  console.log(APPLY ? `Remapped ${changed} courses (others already correct).` : `Dry run complete — ${courses.length} courses would be remapped.`);

  if (APPLY) {
    const cats = await prisma.courseCategory.findMany({
      where: { tenantId }, orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, _count: { select: { courses: true } } },
    });
    console.log('\nCategory course counts:');
    cats.forEach((c) => console.log(`  ${c.name} (${c.slug}): ${c._count.courses}`));
    const cvAfter = await prisma.courseVersion.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
    console.log('\nCourseVersion after:', cvAfter._count._all, 'rows; max updatedAt', cvAfter._max.updatedAt);
    const unchanged = cvBefore._count._all === cvAfter._count._all && String(cvBefore._max.updatedAt) === String(cvAfter._max.updatedAt);
    console.log('CourseVersion UNCHANGED (proof versions/content untouched):', unchanged);
    if (!unchanged) { console.error('!! CourseVersion changed — investigate before committing.'); process.exit(1); }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
