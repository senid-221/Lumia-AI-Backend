import { db } from './prisma';

export function chunkText(text: string, size = 900, overlap = 120) {
  const clean = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + size);
    if (end < clean.length) {
      const boundary = Math.max(clean.lastIndexOf('\n', end), clean.lastIndexOf('. ', end));
      if (boundary > start + size * 0.55) end = boundary + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

export async function createEmbedding(input: string): Promise<number[] | null> {
  const key = process.env.AI_API_KEY, url = process.env.AI_API_URL;
  if (!key || !url) return null;
  const res = await fetch(`${url.replace(/\/$/, '')}/embeddings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small', input }),
  });
  if (!res.ok) throw new Error(`Embedding provider returned ${res.status}`);
  const data = await res.json();
  const v = data?.data?.[0]?.embedding;
  return Array.isArray(v) ? v.map(Number) : null;
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export async function indexKnowledgeItem(knowledgeItemId: string, businessId: string, title: string, content: string) {
  const chunks = chunkText(content);
  const embeddings: Array<number[] | null> = [];
  for (const chunk of chunks) embeddings.push(await createEmbedding(`${title}\n${chunk}`));
  await db.$transaction(async tx => {
    await tx.knowledgeChunk.deleteMany({ where: { knowledgeItemId, businessId } });
    for (let i = 0; i < chunks.length; i++) {
      await tx.knowledgeChunk.create({ data: { businessId, knowledgeItemId, chunkIndex: i, content: chunks[i], embedding: embeddings[i] ?? undefined } });
    }
  });
  return { chunks: chunks.length, embedded: embeddings.filter(Boolean).length };
}

export async function retrieveSemanticKnowledge(businessId: string, query: string, limit = 8) {
  const q = await createEmbedding(query);
  const rows = await db.knowledgeChunk.findMany({ where: { businessId }, include: { knowledgeItem: true }, take: 2000 });
  if (!q) return [];
  return rows.map(r => ({ id: r.knowledgeItemId, chunkId: r.id, title: r.knowledgeItem.title, content: r.content, score: cosineSimilarity(q, Array.isArray(r.embedding) ? r.embedding.map(Number) : []) }))
    .filter(x => x.score > 0.2).sort((a,b) => b.score-a.score).slice(0, limit);
}
