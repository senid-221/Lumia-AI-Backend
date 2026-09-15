import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import { signinSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = signinSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setSession(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || 'Invalid request' },
      { status: 400 },
    );
  }
}
