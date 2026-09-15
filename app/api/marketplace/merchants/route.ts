import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const schema = z.object({
  businessId: z.string().min(1),
  displayName: z.string().min(2).max(120),
  contactPhone: z.string().max(40).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  status: z.enum(['PENDING','ACTIVE','SUSPENDED']).optional()
});

async function assertMember(userId: string, businessId: string) {
  return db.membership.findFirst({ where: { userId, businessId } });
}

export async function GET() {
  try {
    const user = await requireUser();
    const memberships = await db.membership.findMany({ where: { userId: user.id }, select: { businessId: true } });
    const businessIds = memberships.map(m => m.businessId);
    const merchants = await db.merchant.findMany({ where: { businessId: { in: businessIds } }, include: { stores: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ merchants });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'UNAUTHORIZED' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    const membership = await assertMember(user.id, input.businessId);
    if (!membership) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    const merchant = await db.merchant.create({ data: {
      businessId: input.businessId,
      displayName: input.displayName,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      status: input.status ?? 'PENDING'
    }, include: { stores: true } });
    return NextResponse.json({ merchant }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.flatten() : (e instanceof Error ? e.message : 'BAD_REQUEST') }, { status: 400 });
  }
}
