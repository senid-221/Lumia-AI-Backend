import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma'; import { setSession } from '@/lib/auth'; import { signinSchema } from '@/lib/validation';
export async function POST(req:Request){try{const b=signinSchema.parse(await req.json());const u=await db.user.findUnique({where:{email:b.email.toLowerCase()}});if(!u||!(await bcrypt.compare(b.password,u.passwordHash)))return NextResponse.json({error:'Invalid email or password'},{status:401});await setSession(u.id);return NextResponse.json({user:{id:u.id,name:u.name,email:u.email}});}catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||'Invalid request'},{status:400});}}
