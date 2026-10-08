import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { MAX_PASSWORD_LENGTH } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, {
      keyPrefix: 'register',
      limit: 5,
      windowSeconds: 900, // 15 minutes
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop de tentatives d\'inscription. Veuillez réessayer dans quelques minutes.'
      );
    }

    const body = await request.json();
    const { name, phone, password } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return NextResponse.json({ error: 'Le numéro de téléphone est obligatoire.' }, { status: 400 });
    }
    const phoneRegex = /^[+0-9\s-]{8,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: 'Un numéro de téléphone valide est obligatoire.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' }, { status: 400 });
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères.` }, { status: 400 });
    }

    const phoneNormalized = phone.trim();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use an atomic database transaction to prevent first-user bootstrap race conditions (Issue #42)
    const runInTransaction = async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
      if (typeof prisma.$transaction === 'function') {
        return prisma.$transaction(fn);
      }
      return fn(prisma);
    };

    const newUser = await runInTransaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.user.findFirst({
        where: { phone: phoneNormalized },
      });

      if (existingUser) {
        throw new Error('PhoneAlreadyUsed');
      }

      // Determine role atomically
      const userCount = await tx.user.count();
      const role = userCount === 0 ? 'admin' : 'user';

      // Create the user (phone-only registration without email: emailVerified is null)
      const createdUser = await tx.user.create({
        data: {
          name: name.trim(),
          phone: phoneNormalized,
          password: hashedPassword,
          role,
          emailVerified: null,
        },
      });

      // Automatically claim all prior guest orders associated with this phone number (Issue #68)
      await tx.order.updateMany({
        where: {
          customerPhone: phoneNormalized,
          userId: null,
        },
        data: {
          userId: createdUser.id,
        },
      });

      return createdUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
      userId: newUser.id,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'PhoneAlreadyUsed') {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé.' }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
