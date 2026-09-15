import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const schema = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(1000) })).min(1).max(100),
});

function statusFor(message: string) {
  if (message === 'FORBIDDEN') return 403;
  if (message === 'CUSTOMER_NOT_FOUND' || message === 'PRODUCT_NOT_FOUND') return 404;
  if (message === 'OUT_OF_STOCK' || message === 'MIXED_CURRENCY_NOT_SUPPORTED') return 409;
  return 400;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    const member = await db.membership.findFirst({ where: { userId: user.id, businessId: input.businessId } });
    if (!member) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    const customer = await db.customer.findFirst({ where: { id: input.customerId, businessId: input.businessId } });
    if (!customer) return NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });

    const result = await db.$transaction(async tx => {
      const products = await Promise.all(input.items.map(item => tx.marketplaceProduct.findFirst({
        where: { id: item.productId, active: true, merchant: { status: 'ACTIVE' } },
        select: { id: true, merchantId: true, sellingPrice: true, currency: true, stock: true, commissionRate: true }
      })));
      if (products.some(p => !p)) throw new Error('PRODUCT_NOT_FOUND');

      const rows = products.map((product, index) => ({ product: product!, quantity: input.items[index].quantity }));
      const currency = rows[0].product.currency;
      if (rows.some(r => r.product.currency !== currency)) throw new Error('MIXED_CURRENCY_NOT_SUPPORTED');

      const total = rows.reduce((sum, row) => sum + Number(row.product.sellingPrice) * row.quantity, 0);
      const order = await tx.order.create({ data: { businessId: input.businessId, customerId: input.customerId, total, currency, status: 'PENDING' } });

      for (const row of rows) {
        const updated = await tx.marketplaceProduct.updateMany({
          where: { id: row.product.id, stock: { gte: row.quantity }, active: true, merchant: { status: 'ACTIVE' } },
          data: { stock: { decrement: row.quantity } },
        });
        if (updated.count !== 1) throw new Error('OUT_OF_STOCK');

        const gross = Number(row.product.sellingPrice) * row.quantity;
        const commission = gross * Number(row.product.commissionRate);
        await tx.commission.create({ data: {
          merchantId: row.product.merchantId,
          productId: row.product.id,
          orderId: order.id,
          grossAmount: gross,
          commission,
          merchantNet: gross - commission,
          currency,
        }});
      }
      return order;
    });

    return NextResponse.json({ ok: true, orderId: result.id, status: result.status, total: result.total.toString(), currency: result.currency }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_REQUEST', details: e.flatten() }, { status: 400 });
    const message = e instanceof Error ? e.message : 'BAD_REQUEST';
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}
