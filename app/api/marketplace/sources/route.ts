import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const schema = z.object({
  merchantId: z.string().min(1),
  storeId: z.string().min(1).optional().nullable(),
  type: z.enum(['MANUAL','API','CSV','PARTNER']),
  name: z.string().min(2).max(120),
  endpoint: z.string().url().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    const merchant = await db.merchant.findUnique({ where: { id: input.merchantId } });
    if (!merchant) return NextResponse.json({ error: 'MERCHANT_NOT_FOUND' }, { status: 404 });
    const member = await db.membership.findFirst({ where: { userId: user.id, businessId: merchant.businessId } });
    if (!member) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    if (input.storeId) {
      const store = await db.merchantStore.findFirst({ where: { id: input.storeId, merchantId: merchant.id, active: true } });
      if (!store) return NextResponse.json({ error: 'STORE_NOT_FOUND' }, { status: 404 });
    }

    const source = await db.productSource.create({
      data: {
        merchantId: merchant.id,
        storeId: input.storeId ?? null,
        type: input.type,
        name: input.name,
        endpoint: input.endpoint ?? null,
      },
    });
    return NextResponse.json({ source }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.flatten() : (e instanceof Error ? e.message : 'BAD_REQUEST') }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const merchantId = url.searchParams.get('merchantId');
    if (!merchantId) return NextResponse.json({ error: 'MERCHANT_ID_REQUIRED' }, { status: 400 });
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return NextResponse.json({ error: 'MERCHANT_NOT_FOUND' }, { status: 404 });
    const member = await db.membership.findFirst({ where: { userId: user.id, businessId: merchant.businessId } });
    if (!member) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    const sources = await db.productSource.findMany({ where: { merchantId }, include: { store: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ sources });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'UNAUTHORIZED' }, { status: 401 });
  }
}
