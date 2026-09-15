import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth'; import { db } from '@/lib/prisma';
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser(); if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const m = await db.membership.findFirst({ where: { userId: u.id } }); if (!m) return NextResponse.json({ error: 'No business' }, { status: 403 });
  const { id } = await params;
  const conversation = await db.conversation.findFirst({ where: { id, businessId: m.businessId }, include: { customer: true, messages: { orderBy: { createdAt: 'asc' } } } });
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  return NextResponse.json({ conversation });
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser(); if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const m = await db.membership.findFirst({ where: { userId: u.id } }); if (!m) return NextResponse.json({ error: 'No business' }, { status: 403 });
  const { id } = await params; const body = await req.json();
  if (!['AI','HUMAN'].includes(body.status)) return NextResponse.json({ error: 'status must be AI or HUMAN' }, { status: 400 });
  const updated = await db.conversation.updateMany({ where: { id, businessId: m.businessId }, data: { status: body.status } });
  if (!updated.count) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  return NextResponse.json({ ok: true, status: body.status });
}
