import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const [merchants, products] = await Promise.all([
      (db as any).merchant.count({ where: { status: 'ACTIVE' } }),
      (db as any).marketplaceProduct.count({ where: { active: true } }),
    ]);
    return NextResponse.json({ ok: true, marketplace: { merchants, products } });
  } catch (error) {
    console.error('Marketplace health failed', error);
    return NextResponse.json({ ok: false, error: 'Marketplace database migration has not been applied.' }, { status: 503 });
  }
}
