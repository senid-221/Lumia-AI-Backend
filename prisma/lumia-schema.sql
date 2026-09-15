-- Lumia AI / Simpa Shopper PostgreSQL schema.
-- This file mirrors prisma/schema.prisma.
-- Use it in Neon SQL Editor only if you are not using `prisma migrate deploy`.
-- Safe to re-run: drops and recreates the Lumia application tables.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS "SocialLead" CASCADE;
DROP TABLE IF EXISTS "SocialChannel" CASCADE;
DROP TABLE IF EXISTS "Payout" CASCADE;
DROP TABLE IF EXISTS "Commission" CASCADE;
DROP TABLE IF EXISTS "MarketplaceProduct" CASCADE;
DROP TABLE IF EXISTS "ProductSource" CASCADE;
DROP TABLE IF EXISTS "MerchantStore" CASCADE;
DROP TABLE IF EXISTS "Merchant" CASCADE;
DROP TABLE IF EXISTS "CustomerMemory" CASCADE;
DROP TABLE IF EXISTS "WebhookEvent" CASCADE;
DROP TABLE IF EXISTS "UsageRecord" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "WhatsAppAccount" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "KnowledgeChunk" CASCADE;
DROP TABLE IF EXISTS "KnowledgeItem" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Membership" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Business" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TYPE "Role" AS ENUM ('OWNER','ADMIN','AGENT');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING','CONFIRMED','PROCESSING','READY','DELIVERED','CANCELLED');
CREATE TYPE "MessageRole" AS ENUM ('USER','ASSISTANT','SYSTEM');
CREATE TYPE "MerchantStatus" AS ENUM ('PENDING','ACTIVE','SUSPENDED');
CREATE TYPE "ProductSourceType" AS ENUM ('MANUAL','API','CSV','PARTNER');
CREATE TYPE "ChannelType" AS ENUM ('WHATSAPP','INSTAGRAM','FACEBOOK','TIKTOK');
CREATE TYPE "ChannelStatus" AS ENUM ('DISCONNECTED','CONNECTED','ERROR');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING','PROCESSING','PAID','FAILED');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Business" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  "whatsappPhone" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
  "instructions" TEXT,
  "address" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Membership" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "userId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'AGENT',
  UNIQUE ("userId","businessId"),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX "Membership_businessId_idx" ON "Membership"("businessId");

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "name" TEXT,
  "phone" TEXT,
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("businessId","phone"),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");

CREATE TABLE "Conversation" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AI',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);
CREATE INDEX "Conversation_businessId_updatedAt_idx" ON "Conversation"("businessId","updatedAt");

CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "conversationId" TEXT NOT NULL,
  "role" "MessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("conversationId","externalId"),
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
);
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId","createdAt");

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "stock" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX "Product_businessId_active_idx" ON "Product"("businessId","active");

CREATE TABLE "KnowledgeItem" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX "KnowledgeItem_businessId_idx" ON "KnowledgeItem"("businessId");

CREATE TABLE "KnowledgeChunk" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "knowledgeItemId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("knowledgeItemId","chunkIndex"),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem"("id") ON DELETE CASCADE
);
CREATE INDEX "KnowledgeChunk_businessId_idx" ON "KnowledgeChunk"("businessId");

CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "total" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);
CREATE INDEX "Order_businessId_createdAt_idx" ON "Order"("businessId","createdAt");

CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(14,2) NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

CREATE TABLE "WhatsAppAccount" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL UNIQUE,
  "phoneNumberId" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'STARTER',
  "status" TEXT NOT NULL DEFAULT 'TRIALING',
  "monthlyPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "renewsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE "UsageRecord" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "messages" INTEGER NOT NULL DEFAULT 0,
  "aiRuns" INTEGER NOT NULL DEFAULT 0,
  "whatsappIn" INTEGER NOT NULL DEFAULT 0,
  "whatsappOut" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("businessId","period"),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL UNIQUE,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WebhookEvent_provider_createdAt_idx" ON "WebhookEvent"("provider","createdAt");

CREATE TABLE "CustomerMemory" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("businessId","customerId","key"),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);
CREATE INDEX "CustomerMemory_businessId_customerId_idx" ON "CustomerMemory"("businessId","customerId");

CREATE TABLE "Merchant" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" "MerchantStatus" NOT NULL DEFAULT 'PENDING',
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX "Merchant_businessId_status_idx" ON "Merchant"("businessId","status");

CREATE TABLE "MerchantStore" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "merchantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" TEXT,
  "externalId" TEXT,
  "storeUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE
);
CREATE INDEX "MerchantStore_merchantId_active_idx" ON "MerchantStore"("merchantId","active");

CREATE TABLE "ProductSource" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "merchantId" TEXT NOT NULL,
  "storeId" TEXT,
  "type" "ProductSourceType" NOT NULL,
  "name" TEXT NOT NULL,
  "endpoint" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE,
  FOREIGN KEY ("storeId") REFERENCES "MerchantStore"("id") ON DELETE SET NULL
);
CREATE INDEX "ProductSource_merchantId_active_idx" ON "ProductSource"("merchantId","active");

CREATE TABLE "MarketplaceProduct" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "merchantId" TEXT NOT NULL,
  "sourceId" TEXT,
  "externalId" TEXT,
  "sku" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "costPrice" DECIMAL(14,2) NOT NULL,
  "sellingPrice" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "stock" INTEGER NOT NULL DEFAULT 0,
  "commissionRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE,
  FOREIGN KEY ("sourceId") REFERENCES "ProductSource"("id") ON DELETE SET NULL
);
CREATE INDEX "MarketplaceProduct_merchantId_active_idx" ON "MarketplaceProduct"("merchantId","active");
CREATE INDEX "MarketplaceProduct_name_idx" ON "MarketplaceProduct"("name");

CREATE TABLE "Commission" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "merchantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "grossAmount" DECIMAL(14,2) NOT NULL,
  "commission" DECIMAL(14,2) NOT NULL,
  "merchantNet" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id"),
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);
CREATE INDEX "Commission_merchantId_createdAt_idx" ON "Commission"("merchantId","createdAt");
CREATE INDEX "Commission_orderId_idx" ON "Commission"("orderId");

CREATE TABLE "Payout" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "merchantId" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE
);
CREATE INDEX "Payout_merchantId_status_idx" ON "Payout"("merchantId","status");

CREATE TABLE "SocialChannel" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "type" "ChannelType" NOT NULL,
  "status" "ChannelStatus" NOT NULL DEFAULT 'DISCONNECTED',
  "externalPageId" TEXT,
  "externalUserId" TEXT,
  "accessTokenRef" TEXT,
  "metadata" JSONB,
  "connectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("businessId","type"),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX "SocialChannel_businessId_status_idx" ON "SocialChannel"("businessId","status");

CREATE TABLE "SocialLead" (
  "id" TEXT PRIMARY KEY DEFAULT ('cl' || encode(gen_random_bytes(12), 'hex')),
  "businessId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "customerId" TEXT,
  "externalUserId" TEXT,
  "sourceUrl" TEXT,
  "campaign" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  FOREIGN KEY ("channelId") REFERENCES "SocialChannel"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
);
CREATE INDEX "SocialLead_businessId_createdAt_idx" ON "SocialLead"("businessId","createdAt");

COMMIT;
