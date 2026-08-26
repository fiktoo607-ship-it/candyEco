import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';

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
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    }
    if (!phone || phone.trim() === '') {
      return NextResponse.json({ error: 'Le numéro de téléphone est obligatoire.' }, { status: 400 });
    }
    const phoneRegex = /^[+0-9\s-]{8,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: 'Un numéro de téléphone valide est obligatoire.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' }, { status: 400 });
    }

    const phoneNormalized = phone.trim();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { phone: phoneNormalized },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé.' }, { status: 400 });
    }

    // Determine role (admin if first user)
    let role = 'user';
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      role = 'admin';
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user (pre-verified because no email is provided for email verification)
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: phoneNormalized,
        password: hashedPassword,
        role,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
      userId: newUser.id,
    }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
