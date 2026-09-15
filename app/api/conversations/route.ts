import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth'; import { db } from '@/lib/prisma';
export async function GET(){const u=await getUser();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});const m=await db.membership.findFirst({where:{userId:u.id}});if(!m)return NextResponse.json({error:'No business access'},{status:403});return NextResponse.json({conversations:await db.conversation.findMany({where:{businessId:m.businessId},include:{customer:true,_count:{select:{messages:true}}},orderBy:{updatedAt:'desc'},take:100})});}
