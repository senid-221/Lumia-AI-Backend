import { NextRequest, NextResponse } from 'next/server';
import { searchMarketplaceProducts } from '@/lib/marketplace';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? '';
  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 50) : 20;

  try {
    const products = await searchMarketplaceProducts(query, limit);
    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error('Marketplace search failed', error);
    return NextResponse.json({ error: 'Marketplace is not initialized yet. Apply the marketplace Prisma migration first.' }, { status: 503 });
  }
}
