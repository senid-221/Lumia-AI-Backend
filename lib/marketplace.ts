import { db } from './prisma';

export type MarketplaceProductView = {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sellingPrice: string;
  currency: string;
  stock: number;
  commissionRate: string;
};

/**
 * Search active marketplace products after the marketplace schema migration
 * is applied. Kept separate from the existing business catalog search so the
 * two commerce modes can evolve independently.
 */
export async function searchMarketplaceProducts(query: string, limit = 20): Promise<MarketplaceProductView[]> {
  const normalized = query.trim().toLowerCase();
  const products = await (db as any).marketplaceProduct.findMany({
    where: { active: true, merchant: { status: 'ACTIVE' } },
    take: 200,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, merchantId: true, name: true, description: true,
      imageUrl: true, sellingPrice: true, currency: true, stock: true,
      commissionRate: true,
    },
  });
  if (!normalized) return products.slice(0, limit).map(toView);
  const terms = normalized.split(/\s+/).filter(t => t.length > 1);
  return products
    .filter((p: any) => terms.some((t: string) => `${p.name} ${p.description ?? ''}`.toLowerCase().includes(t)))
    .slice(0, limit)
    .map(toView);
}

function toView(p: any): MarketplaceProductView {
  return {
    id: p.id,
    merchantId: p.merchantId,
    name: p.name,
    description: p.description ?? null,
    imageUrl: p.imageUrl ?? null,
    sellingPrice: p.sellingPrice.toString(),
    currency: p.currency,
    stock: p.stock,
    commissionRate: p.commissionRate.toString(),
  };
}

export async function calculateCommission(args: {
  sellingPrice: number;
  quantity: number;
  commissionRatePercent: number;
}) {
  const gross = args.sellingPrice * args.quantity;
  const commission = gross * (args.commissionRatePercent / 100);
  return { gross, commission, merchantNet: gross - commission };
}
