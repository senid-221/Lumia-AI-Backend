import { db } from './prisma';
import { assertUsageAvailable } from './billing';
import { createOrderFromProducts, recentCustomerOrders } from './automation';
import { getCustomerMemories, retrieveBusinessKnowledge, rememberCustomer, extractUsefulMemory } from './intelligence';

export type AgentContext = { businessId: string; conversationId: string; customerId?: string; customerName?: string | null; message: string };
const ACTIONS = ['NONE','SEARCH_PRODUCTS','CREATE_ORDER','ORDER_STATUS','HANDOFF'] as const;
type Action = typeof ACTIONS[number];
export type AIResult = { reply: string; action: Action; productId?: string; productName?: string; quantity?: number; orderId?: string; confidence?: number; products?: Array<{id:string;name:string;price:string;currency:string;stock:number}> };

function parseModel(raw: string): AIResult | null {
  const cleaned = raw.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.reply !== 'string' || !ACTIONS.includes(parsed.action)) return null;
    return parsed;
  } catch { return { reply: raw, action: 'NONE', confidence: 0.5 }; }
}

async function callModel(system: string, user: string): Promise<AIResult | null> {
  const key = process.env.AI_API_KEY, url = process.env.AI_API_URL;
  if (!key || !url) return null;
  const res = await fetch(`${url.replace(/\/$/,'')}/chat/completions`, {
    method:'POST', headers:{'content-type':'application/json', authorization:`Bearer ${key}`},
    body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', temperature:0.15, messages:[{role:'system',content:system},{role:'user',content:user}] })
  });
  if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  return typeof raw === 'string' ? parseModel(raw) : null;
}

function fallback(ctx: AgentContext, knowledge: string, products: string): AIResult {
  const q = ctx.message.toLowerCase();
  if (/human|agent|person|umuntu|uhuze n['’]?umukozi|vugana n/.test(q)) return {reply:'Ndabyumvise. Ngiye kuguhuza n’umukozi wa business.', action:'HANDOFF', confidence:1};
  if (/order|gura|nguze|buy|purchase|commande|gutumiza/.test(q) && products) return {reply:'Nshobora kugufasha gukora order. Mbwira product ushaka n’umubare.', action:'SEARCH_PRODUCTS', confidence:0.75};
  return {reply: knowledge ? 'Ndashobora kugufasha nkurikije amakuru ya business. Wambwira neza icyo ushaka kumenya?' : 'Muraho! Ndi Lumia AI. Ubu nta makuru ahagije ya business mfite. Nyamuneka gerageza nyuma cyangwa saba umukozi.', action:'NONE', confidence:0.5};
}

async function incrementUsage(businessId: string, field: 'messages'|'aiRuns'|'whatsappIn'|'whatsappOut') {
  const period = new Date().toISOString().slice(0,7);
  await db.usageRecord.upsert({ where:{businessId_period:{businessId,period}}, create:{businessId,period,[field]:1}, update:{[field]:{increment:1}} });
}

export async function executeLumiaAction(ctx: AgentContext, result: AIResult) {
  if (!ctx.customerId) return result;
  if (result.action === 'CREATE_ORDER') await assertUsageAvailable(ctx.businessId, 'messages');
  if (result.action === 'SEARCH_PRODUCTS') {
    const query = result.productName || ctx.message;
    const tokens = query.toLowerCase().split(/\s+/).filter(x=>x.length>2);
    const all = await db.product.findMany({where:{businessId:ctx.businessId,active:true},orderBy:{updatedAt:'desc'},take:100});
    const matches = all.filter(p => !tokens.length || tokens.some(t => `${p.name} ${p.description||''}`.toLowerCase().includes(t))).slice(0,10);
    const products = matches.map(p=>({id:p.id,name:p.name,price:p.price.toString(),currency:p.currency,stock:p.stock}));
    const reply = matches.length ? matches.map(p=>`${p.name} — ${Number(p.price).toLocaleString()} ${p.currency} (stock: ${p.stock})`).join('\n') : 'Nta product ihuye n’ibyo ushaka nabonye.';
    return {...result, products, reply};
  }
  if (result.action === 'CREATE_ORDER') {
    const qty = Number(result.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) return {...result,action:'NONE',reply:'Mbwira umubare wa product ushaka (1–1000).'};
    let product = result.productId ? await db.product.findFirst({where:{id:result.productId,businessId:ctx.businessId,active:true}}) : null;
    if (!product && result.productName) {
      const all = await db.product.findMany({where:{businessId:ctx.businessId,active:true},take:200});
      const q = result.productName.toLowerCase();
      product = all.find(p => p.name.toLowerCase() === q) || all.find(p => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())) || null;
    }
    if (!product) return {...result,action:'SEARCH_PRODUCTS',reply:'Sinabonye iyo product neza. Mbwira izina ryayo uko ryanditse muri catalog.'};
    try {
      const order = await createOrderFromProducts({ businessId:ctx.businessId, customerId:ctx.customerId, productId:product.id, quantity:qty });
      return {...result,productId:product.id,orderId:order.id,reply:`Order yawe yakiriwe. Order ID: ${order.id}. Total: ${Number(order.total).toLocaleString()} ${order.currency}.`};
    } catch (e) {
      if (e instanceof Error && e.message === 'OUT_OF_STOCK') return {...result,action:'NONE',reply:`Mbabarira, ${product.name} ntifite stock ihagije kuri ubu.`};
      throw e;
    }
  }
  if (result.action === 'ORDER_STATUS') {
    const orders = result.orderId
      ? await db.order.findMany({where:{id:result.orderId,businessId:ctx.businessId,customerId:ctx.customerId},take:1})
      : await recentCustomerOrders(ctx.businessId, ctx.customerId, 3);
    if (!orders.length) return {...result,action:'NONE',reply:'Sinabonye order kuri iyi customer.'};
    return {...result,reply:orders.map(o=>`Order ${o.id}: ${o.status} — ${Number(o.total).toLocaleString()} ${o.currency}`).join('\n')};
  }
  return result;
}

export async function runLumiaAgent(ctx: AgentContext): Promise<AIResult> {
  const [business, products, history, memories] = await Promise.all([
    db.business.findUnique({where:{id:ctx.businessId}}),
    db.product.findMany({where:{businessId:ctx.businessId,active:true},take:100,orderBy:{updatedAt:'desc'}}),
    db.message.findMany({where:{conversationId:ctx.conversationId},orderBy:{createdAt:'desc'},take:16}),
    getCustomerMemories(ctx.businessId,ctx.customerId)
  ]);
  if (!business) throw new Error('BUSINESS_NOT_FOUND');
  if (ctx.customerId) for (const m of extractUsefulMemory(ctx.message)) await rememberCustomer(ctx.businessId,ctx.customerId,m.key,m.value);
  const relevant = await retrieveBusinessKnowledge(ctx.businessId, ctx.message);
  const knowledgeText = relevant.map(k=>`# ${k.title} [relevance ${k.score}]\n${k.content}`).join('\n\n');
  const productText = products.map(p=>`${p.id}|${p.name}|${p.description||''}|${p.price.toString()} ${p.currency}|stock=${p.stock}`).join('\n');
  const historyText = history.reverse().map(m=>`${m.role}: ${m.content}`).join('\n');
  const memoryText = memories.map(m=>`${m.key}: ${m.value}`).join('\n');
  const system = `You are Lumia AI, an AI employee for a business. Use ONLY supplied business context. Never invent price, stock, policies, order status or availability. Respond in Kinyarwanda or English matching the customer. If unsure, say so and use HANDOFF. Return ONLY JSON: {reply,action,productId?,productName?,quantity?,orderId?,confidence?}. Actions: NONE, SEARCH_PRODUCTS, CREATE_ORDER, ORDER_STATUS, HANDOFF. CREATE_ORDER is allowed only when the customer clearly asks to buy/order and the product + quantity are explicit. Prefer productName if productId is unknown; the server resolves it. Never claim an order exists before the server creates it.\nBUSINESS=${business.name}\nINSTRUCTIONS=${business.instructions||'Be helpful, concise and professional.'}\nKNOWLEDGE=${knowledgeText||'none'}\nPRODUCTS=${productText||'none'}\nCUSTOMER MEMORY=${memoryText||'none'}`;
  const model = await callModel(system, `Customer: ${ctx.customerName||'Unknown'}\nConversation:\n${historyText}\nNew message: ${ctx.message}`);
  await incrementUsage(ctx.businessId,'aiRuns');
  return model || fallback(ctx,knowledgeText,productText);
}
