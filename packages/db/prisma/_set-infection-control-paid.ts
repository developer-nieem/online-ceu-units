/** REVIEW-ONLY: revert infection-control to paid pricing for CDPH review deployment. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = 'infection-control';
  const c = await prisma.course.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, catalogData: true },
  });
  if (!c) {
    console.log(slug, 'NOT FOUND');
    return;
  }
  const cd = { ...((c.catalogData as object) ?? {}) } as Record<string, unknown>;
  cd.price = 3.75;
  cd.pricing = { ...((cd.pricing as object) ?? {}), isFree: false, priceCents: 375 };
  await prisma.course.update({ where: { id: c.id }, data: { catalogData: cd } });
  console.log(slug, '-> price:3.75, pricing.isFree:false, priceCents:375');
}

main().catch(console.error).finally(() => prisma.$disconnect());
