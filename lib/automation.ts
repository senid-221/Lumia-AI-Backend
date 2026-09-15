import { db } from './prisma';

export async function createOrderFromProducts(params: { businessId: string; customerId: string; productId: string; quantity: number; }) {
  const { businessId, customerId, productId, quantity } = params;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('INVALID_QUANTITY');
  return db.$transaction(async tx => {
    const product = await tx.product.findFirst({ where: { id: productId, businessId, active: true } });
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    const updated = await tx.product.updateMany({ where: { id: product.id, businessId, active: true, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
    if (updated.count !== 1) throw new Error('OUT_OF_STOCK');
    return tx.order.create({ data: { businessId, customerId, total: Number(product.price) * quantity, currency: product.currency, items: { create: [{ productId: product.id, quantity, unitPrice: product.price }] } }, include: { items: { include: { product: true } } } });
  });
}

export async function recentCustomerOrders(businessId: string, customerId: string, limit = 5) {
  return db.order.findMany({ where: { businessId, customerId }, orderBy: { createdAt: 'desc' }, take: limit, include: { items: { include: { product: true } } } });
}
