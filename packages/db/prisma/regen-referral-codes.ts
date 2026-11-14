import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

function newCode(): string {
  const b = randomBytes(5);
  let d = '';
  for (let i = 0; i < 5; i++) d += (b[i]! % 10).toString();
  return `CAL${d}`;
}

async function main() {
  console.log(APPLY ? '=== APPLY (writing) ===' : '=== DRY RUN (no writes) ===');

  const users = await prisma.user.findMany({
    select: { id: true, referralCode: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Users: ${users.length}`);
  if (users.length === 0) { console.log('No users — nothing to do.'); return; }

  // Build unique new codes for every user, avoiding collisions with each other.
  const used = new Set<string>();
  const oldToNew = new Map<string, string>();   // oldCode -> newCode (for referredByCode remap)
  const plan: { id: string; oldCode: string; newCode: string }[] = [];

  for (const u of users) {
    let code = newCode();
    let tries = 0;
    while (used.has(code)) {
      code = newCode();
      if (++tries > 10000) throw new Error('Exhausted CAL+5 space (100000 max) — too many users for this format.');
    }
    used.add(code);
    if (u.referralCode) oldToNew.set(u.referralCode, code);
    plan.push({ id: u.id, oldCode: u.referralCode ?? '(none)', newCode: code });
  }

  // Which referredByCode values will be remapped vs. left as-is
  const referredRows = await prisma.user.findMany({
    where: { referredByCode: { not: null } },
    select: { id: true, referredByCode: true },
  });
  let remapCount = 0, danglingUnmapped = 0;
  for (const r of referredRows) {
    if (r.referredByCode && oldToNew.has(r.referredByCode)) remapCount++;
    else danglingUnmapped++;
  }

  console.log(`referralCode updates: ${plan.length}`);
  console.log(`referredByCode remaps (pointer follows to new code): ${remapCount}`);
  console.log(`referredByCode values NOT matching any user's old code (left unchanged): ${danglingUnmapped}`);
  console.log('Sample new codes:', plan.slice(0, 5).map(p => p.newCode).join(', '));

  if (!APPLY) { console.log('\nDry run complete. Re-run with --apply to write.'); return; }

  // Apply in a transaction. Two-phase to avoid transient @unique collisions:
  // 1) set every referralCode to a temporary unique value, 2) set final codes + remap referredByCode.
  await prisma.$transaction(async (tx) => {
    // phase 1: temp codes (guaranteed not to collide with final CAL codes: use "TMP" + 5 digits of index)
    for (let i = 0; i < plan.length; i++) {
      const tmp = `TMP${String(i).padStart(5, '0')}`.slice(0, 8);
      await tx.user.update({ where: { id: plan[i]!.id }, data: { referralCode: tmp } });
    }
    // phase 2: final referralCode
    for (const p of plan) {
      await tx.user.update({ where: { id: p.id }, data: { referralCode: p.newCode } });
    }
    // phase 3: remap referredByCode pointers that referenced an old code
    for (const [oldCode, newCodeVal] of oldToNew.entries()) {
      await tx.user.updateMany({ where: { referredByCode: oldCode }, data: { referredByCode: newCodeVal } });
    }
  }, { timeout: 120000 });

  // verify
  const bad = await prisma.user.count({ where: { NOT: { referralCode: { startsWith: 'CAL' } } } });
  const total = await prisma.user.count();
  console.log(`\nVerify: ${total - bad}/${total} users now have CAL-prefixed codes (non-CAL remaining: ${bad}).`);
  const stillTemp = await prisma.user.count({ where: { referralCode: { startsWith: 'TMP' } } });
  console.log(`Temp codes remaining (must be 0): ${stillTemp}`);
  if (bad !== 0 || stillTemp !== 0) { console.error('!! Not all codes finalized — investigate.'); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
