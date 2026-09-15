import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
export async function GET() { try { await db.$queryRaw`SELECT 1`; return NextResponse.json({ ok: true, service: 'lumia-ai-backend', timestamp: new Date().toISOString() }); } catch { return NextResponse.json({ ok: false, service: 'lumia-ai-backend' }, { status: 503 }); } }
