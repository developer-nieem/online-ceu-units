import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const TARGET_CENTS = 375;

type Pricing = { priceCents?: number; salePriceCents?: number | null; pricingActive?: boolean; isFree?: boolean };

function isFreeCourse(cd: any): boolean {
  const p: Pricing = (cd?.pricing ?? {}) as Pricing;
  if (p.isFree === true) return true;
  // effective 0 = free
  if (p.pricingActive === false) return false; // inactive != free, but won't be sold; treat as not-target below
  if (typeof p.priceCents === 'number' && p.priceCents === 0) return true;
  return false;
}

async function main() {
  console.log(APPLY ? '=== APPLY (writing) ===' : '=== DRY RUN (no writes) ===');

  // published + active (active !== false in catalogData)
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true, title: true, catalogData: true },
  });
  console.log(`PUBLISHED courses: ${courses.length}`);

  const plan: { slug: string; from: string; to: string }[] = [];
  const skippedFree: string[] = [];
  const skippedInactive: string[] = [];
  let alreadyOk = 0;

  for (const c of courses) {
    const cd: any = (c.catalogData as any) ?? {};
    if (cd.active === false) continue; // not active → not shown/sold
    const p: Pricing = (cd.pricing ?? {}) as Pricing;
    if (isFreeCourse(cd)) { skippedFree.push(c.slug); continue; }
    if (p.pricingActive === false) { skippedInactive.push(c.slug); continue; } // don't force-sell an intentionally-unpriced course
    const currentEffective = typeof p.priceCents === 'number' ? p.priceCents : 2900; // default fallback
    const fromStr = `${currentEffective}c${cd.price !== undefined ? ` (legacy price=${cd.price})` : ''}`;
    if (currentEffective === TARGET_CENTS && cd.price === 3.75 && (p.salePriceCents ?? null) === null) { alreadyOk++; continue; }
    plan.push({ slug: c.slug, from: fromStr, to: `${TARGET_CENTS}c` });
    if (APPLY) {
      const newCd = {
        ...cd,
        price: 3.75,
        pricing: { ...(cd.pricing ?? {}), priceCents: TARGET_CENTS, salePriceCents: null, isFree: false, pricingActive: (cd.pricing?.pricingActive ?? true) },
      };
      await prisma.course.update({ where: { id: c.id }, data: { catalogData: newCd as Prisma.InputJsonValue } });
    }
  }

  console.log(`\nWould update: ${plan.length}`);
  plan.slice(0, 60).forEach((x) => console.log(`  ${x.slug}: ${x.from} -> ${x.to}`));
  console.log(`Already $3.75 (unchanged): ${alreadyOk}`);
  console.log(`Skipped FREE (left free): ${skippedFree.length} -> ${skippedFree.join(', ')}`);
  console.log(`Skipped pricingActive=false (not force-priced): ${skippedInactive.length}${skippedInactive.length ? ' -> ' + skippedInactive.join(', ') : ''}`);

  if (!APPLY) { console.log('\nDry run complete. Re-run with --apply to write.'); return; }

  // VERIFY: re-read and confirm every non-free, active, published course is effective 375
  const after = await prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, catalogData: true } });
  let paidAt375 = 0, freeCount = 0, wrong: string[] = [];
  for (const c of after) {
    const cd: any = (c.catalogData as any) ?? {};
    if (cd.active === false) continue;
    const p: Pricing = (cd.pricing ?? {}) as Pricing;
    if (isFreeCourse(cd)) { freeCount++; continue; }
    if (p.pricingActive === false) continue;
    const eff = (p.isFree || p.pricingActive === false) ? 0 : (typeof p.priceCents === 'number' ? (p.salePriceCents != null && p.salePriceCents < p.priceCents ? p.salePriceCents : p.priceCents) : 2900);
    if (eff === 375) paidAt375++; else wrong.push(`${c.slug}=${eff}`);
  }
  console.log(`\nVERIFY: paid courses effective $3.75: ${paidAt375}; free: ${freeCount}; NOT 375: ${wrong.length}${wrong.length ? ' -> ' + wrong.join(', ') : ''}`);
  if (wrong.length) { console.error('!! Some purchasable courses are not $3.75 — investigate.'); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
