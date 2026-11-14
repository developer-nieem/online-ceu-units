/** REVIEW-ONLY: verify review course pricing after pricing updates. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const slugs = ['dementia-care', 'mobility-safety', 'sepsis-recognition', 'infection-control'];

async function main() {
  for (const slug of slugs) {
    const c = await prisma.course.findFirst({
      where: { slug, deletedAt: null },
      select: { slug: true, status: true, catalogData: true },
    });
    if (!c) {
      console.log(slug, 'NOT FOUND');
      continue;
    }
    const cd = (c.catalogData ?? {}) as Record<string, unknown>;
    const pricing = (cd.pricing ?? {}) as Record<string, unknown>;
    console.log(
      slug,
      '| status:',
      c.status,
      '| price:',
      cd.price,
      '| pricing.isFree:',
      pricing.isFree,
      '| pricing.priceCents:',
      pricing.priceCents,
    );
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
