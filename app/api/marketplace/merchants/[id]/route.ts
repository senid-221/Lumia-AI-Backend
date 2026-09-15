import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const schema = z.object({ status: z.enum(['PENDING','ACTIVE','SUSPENDED']).optional() });

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const input = schema.parse(await req.json());
    const merchant = await db.merchant.findUnique({ where: { id } });
    if (!merchant) return NextResponse.json({ error: 'MERCHANT_NOT_FOUND' }, { status: 404 });
    const member = await db.membership.findFirst({ where: { userId: user.id, businessId: merchant.businessId } });
    if (!member) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    const updated = await db.merchant.update({ where: { id }, data: { ...(input.status ? { status: input.status } : {}) }, include: { stores: true } });
    return NextResponse.json({ merchant: updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.flatten() : (e instanceof Error ? e.message : 'BAD_REQUEST') }, { status: 400 });
  }
}
