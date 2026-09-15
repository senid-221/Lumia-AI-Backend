import crypto from 'crypto';
import { db } from './prisma';

export async function sendWhatsAppText(phoneNumberId: string, accessToken: string, to: string, body: string) {
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  const account = await db.whatsAppAccount.findFirst({ where: { phoneNumberId } });
  if (!account) throw new Error('WHATSAPP_ACCOUNT_NOT_FOUND');

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `WhatsApp API ${res.status}`);

  const period = new Date().toISOString().slice(0, 7);
  await db.usageRecord.upsert({
    where: { businessId_period: { businessId: account.businessId, period } },
    create: { businessId: account.businessId, period, whatsappOut: 1 },
    update: { whatsappOut: { increment: 1 } },
  });

  return data;
}

export function verifyWhatsAppSignature(rawBody: string, signature: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!signature?.startsWith('sha256=')) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const actual = signature.slice(7);
  return actual.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function processIncomingWhatsApp(body: any) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  const msg = value?.messages?.[0];

  if (!phoneNumberId || !msg || msg.type !== 'text') return { ignored: true };

  const account = await db.whatsAppAccount.findFirst({ where: { phoneNumberId } });
  if (!account) return { ignored: true, reason: 'unknown_phone_number_id' };

  const externalId = msg.id as string;
  const from = msg.from as string;
  const text = msg.text?.body as string;
  if (!externalId || !from || !text) return { ignored: true };

  const existing = await db.message.findFirst({ where: { externalId } });
  if (existing) return { duplicate: true };

  const customer = await db.customer.upsert({
    where: { businessId_phone: { businessId: account.businessId, phone: from } },
    create: { businessId: account.businessId, phone: from, externalId: from },
    update: { externalId: from },
  });

  let conversation = await db.conversation.findFirst({
    where: { businessId: account.businessId, customerId: customer.id, status: 'AI' },
    orderBy: { updatedAt: 'desc' },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: { businessId: account.businessId, customerId: customer.id },
    });
  }

  await db.message.create({
    data: { conversationId: conversation.id, role: 'USER', content: text, externalId },
  });

  const period = new Date().toISOString().slice(0, 7);
  await db.usageRecord.upsert({
    where: { businessId_period: { businessId: account.businessId, period } },
    create: { businessId: account.businessId, period, messages: 1, whatsappIn: 1 },
    update: { messages: { increment: 1 }, whatsappIn: { increment: 1 } },
  });

  return { ignored: false, account, customer, conversation, text, from };
}
