import { db } from './prisma';

const PLAN_LIMITS: Record<string, { messages: number; aiRuns: number; whatsappOut: number }> = {
  STARTER: { messages: 1000, aiRuns: 1000, whatsappOut: 1000 },
  BUSINESS: { messages: 10000, aiRuns: 10000, whatsappOut: 10000 },
  PRO: { messages: 50000, aiRuns: 50000, whatsappOut: 50000 },
};

export async function getUsage(businessId: string) {
  const period = new Date().toISOString().slice(0, 7);
  const [subscription, usage] = await Promise.all([
    db.subscription.findUnique({ where: { businessId } }),
    db.usageRecord.findUnique({ where: { businessId_period: { businessId, period } } }),
  ]);
  const plan = (subscription?.plan || 'STARTER').toUpperCase();
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.STARTER;
  return { period, plan, status: subscription?.status || 'TRIALING', limits, usage: usage || { messages: 0, aiRuns: 0, whatsappOut: 0 } };
}

export async function assertUsageAvailable(businessId: string, field: 'messages'|'aiRuns'|'whatsappOut') {
  const info = await getUsage(businessId);
  if (Number(info.usage[field] || 0) >= info.limits[field]) throw new Error(`PLAN_LIMIT_${field.toUpperCase()}`);
  return info;
}
