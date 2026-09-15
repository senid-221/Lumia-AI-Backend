import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import { signupSchema } from '@/lib/validation';

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: Request) {
  try {
    const body = signupSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'Email already exists', code: 'EMAIL_EXISTS' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await db.user.create({
      data: {
        name: body.name,
        email,
        passwordHash,
        memberships: {
          create: {
            role: 'OWNER',
            business: {
              create: {
                name: body.businessName,
                slug: slugify(body.businessName),
                subscription: {
                  create: {
                    plan: 'STARTER',
                    status: 'TRIALING',
                  },
                },
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: { business: true },
        },
      },
    });

    await setSession(user.id);

    const business = user.memberships[0]?.business ?? null;
    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email },
        business,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Lumia signup error', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: error.message, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message, code: 'SIGNUP_ERROR' }, { status: 500 });
  }
}
