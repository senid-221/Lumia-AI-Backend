import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const productSchema = z.object({
  merchantId: z.string().min(1),
  sourceId: z.string().min(1).optional().nullable(),
  products: z.array(z.object({
    externalId: z.string().max(200).optional().nullable(),
    sku: z.string().max(100).optional().nullable(),
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    costPrice: z.coerce.number().nonnegative(),
    sellingPrice: z.coerce.number().nonnegative(),
    currency: z.string().length(3).default('RWF'),
    stock: z.coerce.number().int().nonnegative().default(0),
    commissionRate: z.coerce.number().min(0).max(1).default(0),
    active: z.boolean().default(true)
  })).min(1).max(1000)
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = productSchema.parse(await req.json());
    const merchant = await db.merchant.findUnique({ where: { id: input.merchantId } });
    if (!merchant) return NextResponse.json({ error: 'MERCHANT_NOT_FOUND' }, { status: 404 });
    const member = await db.membership.findFirst({ where: { userId: user.id, businessId: merchant.businessId } });
    if (!member) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    if (input.sourceId) {
      const source = await db.productSource.findFirst({ where: { id: input.sourceId, merchantId: merchant.id, active: true } });
      if (!source) return NextResponse.json({ error: 'SOURCE_NOT_FOUND' }, { status: 404 });
    }

    let created = 0;
    let updated = 0;
    for (const p of input.products) {
      if (p.externalId && input.sourceId) {
        const existing = await db.marketplaceProduct.findFirst({ where: { merchantId: merchant.id, sourceId: input.sourceId, externalId: p.externalId } });
        if (existing) {
          await db.marketplaceProduct.update({ where: { id: existing.id }, data: {
            sku: p.sku ?? null,
            name: p.name,
            description: p.description ?? null,
            imageUrl: p.imageUrl ?? null,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
            currency: p.currency,
            stock: p.stock,
            commissionRate: p.commissionRate,
            active: p.active,
            lastSyncedAt: new Date()
          }});
          updated++;
          continue;
        }
      }
      await db.marketplaceProduct.create({ data: {
        merchantId: merchant.id,
        sourceId: input.sourceId ?? null,
        externalId: p.externalId ?? null,
        sku: p.sku ?? null,
        name: p.name,
        description: p.description ?? null,
        imageUrl: p.imageUrl ?? null,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        currency: p.currency,
        stock: p.stock,
        commissionRate: p.commissionRate,
        active: p.active,
        lastSyncedAt: new Date()
      }});
      created++;
    }
    if (input.sourceId) await db.productSource.update({ where: { id: input.sourceId }, data: { lastSyncedAt: new Date() } });
    return NextResponse.json({ ok: true, created, updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.flatten() : (e instanceof Error ? e.message : 'BAD_REQUEST') }, { status: 400 });
  }
}
