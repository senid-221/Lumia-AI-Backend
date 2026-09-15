import { db } from './prisma';

export const SUPPORTED_SOCIAL_CHANNELS = ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'] as const;
export type SocialChannelType = typeof SUPPORTED_SOCIAL_CHANNELS[number];

/**
 * Stores a non-secret reference to a social credential. Real access tokens
 * should live in a secrets manager/KMS and only a reference should be kept in
 * the database. This helper intentionally does not accept or persist raw
 * tokens.
 */
export async function registerSocialChannel(input: {
  businessId: string;
  type: SocialChannelType;
  externalPageId?: string;
  externalUserId?: string;
  accessTokenRef?: string;
  metadata?: Record<string, unknown>;
}) {
  return (db as any).socialChannel.upsert({
    where: { businessId_type: { businessId: input.businessId, type: input.type } },
    create: {
      businessId: input.businessId,
      type: input.type,
      status: 'CONNECTED',
      externalPageId: input.externalPageId,
      externalUserId: input.externalUserId,
      accessTokenRef: input.accessTokenRef,
      metadata: input.metadata,
      connectedAt: new Date(),
    },
    update: {
      status: 'CONNECTED',
      externalPageId: input.externalPageId,
      externalUserId: input.externalUserId,
      accessTokenRef: input.accessTokenRef,
      metadata: input.metadata,
      connectedAt: new Date(),
    },
  });
}
