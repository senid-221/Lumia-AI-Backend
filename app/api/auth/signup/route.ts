import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import { signupSchema } from '@/lib/validation';
function slugify(s:string){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'-'+Math.random().toString(36).slice(2,7)}
export async function POST(req:Request){try{const body=signupSchema.parse(await req.json());const exists=await db.user.findUnique({where:{email:body.email.toLowerCase()}});if(exists)return NextResponse.json({error:'Email already exists'},{status:409});const user=await db.user.create({data:{name:body.name,email:body.email.toLowerCase(),passwordHash:await bcrypt.hash(body.password,12),memberships:{create:{role:'OWNER',business:{create:{name:body.businessName,slug:slugify(body.businessName),subscription:{create:{plan:'STARTER',status:'TRIALING'}}}}}}},include:{memberships:{include:{business:true}}});await setSession(user.id);return NextResponse.json({user:{id:user.id,name:user.name,email:user.email},business:user.memberships[0].business},{status:201});}catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||'Invalid request'},{status:400});}}
