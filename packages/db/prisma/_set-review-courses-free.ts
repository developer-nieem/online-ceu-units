/**
 * CDPH review deployment — set four review courses to free pricing.
 * REVIEW-ONLY: run manually against the review deploy database.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const slugs = ['dementia-care', 'infection-control', 'sepsis-recognition', 'mobility-safety'];

async function main() {
  for (const slug of slugs) {
    const c = await prisma.course.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, catalogData: true },
    });
    if (!c) {
      console.log(slug, '-> NOT FOUND, skipped');
      continue;
    }
    const cd = { ...((c.catalogData as object) ?? {}) } as Record<string, unknown>;
    cd.price = 0;
    cd.pricing = { ...((cd.pricing as object) ?? {}), isFree: true, priceCents: 0 };
    await prisma.course.update({ where: { id: c.id }, data: { catalogData: cd } });
    console.log(slug, '-> price:0, pricing.isFree:true');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
