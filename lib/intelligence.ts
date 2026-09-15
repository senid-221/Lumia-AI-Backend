import { db } from './prisma';
import { retrieveSemanticKnowledge } from './embeddings';

export type RetrievedKnowledge = { id: string; title: string; content: string; score: number };

function tokenize(text: string) {
  return Array.from(new Set(text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9\u00c0-\u024f]+/).filter(x => x.length >= 2)));
}

export function rankKnowledge(query: string, items: Array<{ id: string; title: string; content: string }>, limit = 8): RetrievedKnowledge[] {
  const q = tokenize(query);
  if (!q.length) return [];
  return items.map(item => {
    const hay = tokenize(`${item.title} ${item.content}`);
    const set = new Set(hay);
    const overlap = q.reduce((n, t) => n + (set.has(t) ? 1 : 0), 0);
    const phrase = `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase().trim()) ? 2 : 0;
    return { ...item, score: overlap + phrase };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, limit);
}

export async function retrieveBusinessKnowledge(businessId: string, query: string) {
  const semantic = await retrieveSemanticKnowledge(businessId, query, 8).catch(() => []);
  if (semantic.length) return semantic;
  const items = await db.knowledgeItem.findMany({ where: { businessId }, take: 200, orderBy: { updatedAt: 'desc' } });
  return rankKnowledge(query, items);
}

export async function rememberCustomer(businessId: string, customerId: string, key: string, value: string) {
  return db.customerMemory.upsert({
    where: { businessId_customerId_key: { businessId, customerId, key } },
    create: { businessId, customerId, key, value },
    update: { value },
  });
}

export async function getCustomerMemories(businessId: string, customerId?: string) {
  if (!customerId) return [];
  return db.customerMemory.findMany({ where: { businessId, customerId }, orderBy: { updatedAt: 'desc' }, take: 30 });
}

export function extractUsefulMemory(message: string) {
  const out: Array<{key: string; value: string}> = [];
  const name = message.match(/(?:my name is|nitwa|nitwa\s+)?([A-Z][a-zA-Z'-]{2,})(?:\s|$)/i);
  if (/my name is|nitwa/i.test(message) && name) out.push({ key: 'preferred_name', value: name[1] });
  const location = message.match(/(?:i live in|mba iherereye|ntuye|location yanjye)\s+(.+)/i);
  if (location) out.push({ key: 'location', value: location[1].trim().slice(0, 120) });
  return out;
}
