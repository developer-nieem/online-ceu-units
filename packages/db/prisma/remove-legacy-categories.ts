// packages/db/prisma/remove-legacy-categories.ts
// SAFE cleanup: soft-delete the two EMPTY legacy course categories (cna-renewal, elder-abuse).
// Sets CourseCategory.deletedAt ONLY. Never deletes/edits courses, content, versions, or status.
// Refuses to touch a category that has any course. Idempotent. DRY-RUN by default; --apply to write.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const LEGACY = ['cna-renewal', 'elder-abuse'];
async function main() {
  console.log(APPLY ? '=== APPLY MODE (soft-delete) ===' : '=== DRY RUN (no writes) ===');
  const cats = await prisma.courseCategory.findMany({
    where: { slug: { in: LEGACY }, deletedAt: null },
    select: { id: true, tenantId: true, slug: true, name: true, _count: { select: { courses: true } } },
  });
  if (cats.length === 0) {
    console.log('Nothing to do — no active legacy categories found (already removed).');
    return;
  }
  let toRemove = 0;
  for (const c of cats) {
    if (c._count.courses > 0) {
      console.error(`REFUSING: "${c.name}" (${c.slug}) has ${c._count.courses} course(s) — not empty. Skipping.`);
      continue;
    }
    toRemove++;
    if (!APPLY) { console.log(`WOULD soft-delete: "${c.name}" (${c.slug}) — 0 courses`); continue; }
    await prisma.courseCategory.update({ where: { id: c.id }, data: { deletedAt: new Date() } });
    console.log(`Soft-deleted: "${c.name}" (${c.slug})`);
  }
  if (!APPLY) { console.log(`\nDry run complete — ${toRemove} empty legacy categor${toRemove === 1 ? 'y' : 'ies'} would be removed.`); return; }
  // Verify remaining active categories (expect the 14 taxonomy categories)
  const tenantId = cats[0].tenantId;
  const active = await prisma.courseCategory.findMany({
    where: { tenantId, deletedAt: null }, orderBy: { sortOrder: 'asc' },
    select: { slug: true, name: true, _count: { select: { courses: true } } },
  });
  console.log(`\nActive categories now: ${active.length} (expect 14)`);
  active.forEach((c) => console.log(`  ${c.name} (${c.slug}): ${c._count.courses}`));
  // Sanity: no course lost its category
  const orphans = await prisma.course.count({ where: { tenantId, categoryId: null } });
  console.log(`\nCourses with NO category (should be unaffected by this cleanup): ${orphans}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
