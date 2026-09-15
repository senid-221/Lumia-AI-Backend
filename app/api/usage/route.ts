import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth'; import { db } from '@/lib/prisma'; import { getUsage } from '@/lib/billing';
export async function GET(){const u=await getUser();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});const m=await db.membership.findFirst({where:{userId:u.id}});if(!m)return NextResponse.json({error:'No business access'},{status:403});return NextResponse.json(await getUsage(m.businessId));}
