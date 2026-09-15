import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-change-me');

export async function createToken(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
}
export function hashToken(token: string) { return crypto.createHash('sha256').update(token).digest('hex'); }
export async function setSession(userId: string) {
  const token = await createToken(userId);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 86400000) } });
  (await cookies()).set('lumia_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
}
export async function getUser() {
  const token = (await cookies()).get('lumia_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== 'string') return null;
    const session = await db.session.findFirst({ where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } }, include: { user: true } });
    return session?.user ?? null;
  } catch { return null; }
}
export async function requireUser() { const user = await getUser(); if (!user) throw new Error('UNAUTHORIZED'); return user; }
