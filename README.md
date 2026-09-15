# Lumia AI Backend v1.6

Production-oriented Next.js 15 + Prisma/PostgreSQL backend for Lumia AI.

## Features
- Multi-tenant businesses, users, memberships and secure cookie sessions.
- Business-scoped products, customers, conversations, orders and knowledge.
- Semantic knowledge retrieval with embeddings, chunking and lexical fallback.
- Structured AI actions: search products, create order, order status and human handoff.
- WhatsApp Cloud API connection, webhook verification, inbound processing and outbound replies.
- Usage limits for Starter, Business and Pro plans.
- Basic per-user chat rate limiting.

## Environment
Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, `AI_API_URL`, `AI_MODEL`, `AI_EMBEDDING_MODEL`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET` and related WhatsApp variables as needed.

The AI provider must expose OpenAI-compatible `/chat/completions` and `/embeddings` endpoints.

## Database
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run build
```

## Important security note
WhatsApp credentials should be encrypted at rest with a production KMS/secret manager before launching at scale.

## Main APIs
- `/api/auth/*` — authentication
- `/api/business` — business profile
- `/api/products` — product catalog
- `/api/knowledge` — knowledge management and ingestion
- `/api/chat` — AI chat
- `/api/conversations` — conversation management
- `/api/orders` — orders
- `/api/usage` — monthly usage
- `/api/whatsapp/*` — WhatsApp integration
- `/api/health` — health check
