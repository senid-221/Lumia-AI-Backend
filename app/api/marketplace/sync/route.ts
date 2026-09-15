import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const schema = z.object({ merchantId: z.string().min(1), sourceId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { merchantId, sourceId } = schema.parse(await req.json());
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return NextResponse.json({ error: 'MERCHANT_NOT_FOUND' }, { status: 404 });
    const member = await db.membership.findFirst({ where: { userId: user.id, businessId: merchant.businessId } });
    if (!member) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    const source = await db.productSource.findFirst({ where: { id: sourceId, merchantId, active: true } });
    if (!source) return NextResponse.json({ error: 'SOURCE_NOT_FOUND' }, { status: 404 });
    if (source.type === 'API' && !source.endpoint) return NextResponse.json({ error: 'SOURCE_ENDPOINT_REQUIRED' }, { status: 400 });
    return NextResponse.json({ ok: true, source: { id: source.id, type: source.type, endpoint: source.endpoint }, message: 'Source validated. Use /api/marketplace/products/import to submit the authorized catalog payload.' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.flatten() : (e instanceof Error ? e.message : 'BAD_REQUEST') }, { status: 400 });
  }
}
