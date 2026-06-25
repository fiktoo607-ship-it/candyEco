import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate inputs
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Une adresse e-mail valide est obligatoire.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' }, { status: 400 });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Cette adresse e-mail est déjà utilisée.' }, { status: 400 });
    }

    // Determine role (admin if in ADMIN_EMAILS or if first user)
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let role = 'user';
    if (adminEmails.includes(emailNormalized)) {
      role = 'admin';
    } else {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        role = 'admin';
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user (unverified by default)
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNormalized,
        password: hashedPassword,
        role,
        emailVerified: null,
      },
    });

    // Generate a secure verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Save token to verification table
    await prisma.verificationToken.create({
      data: {
        identifier: emailNormalized,
        token,
        expires,
      },
    });

    // Dispatch verification email
    try {
      await sendVerificationEmail(emailNormalized, token);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      // We don't rollback user creation, but let them know there was an email dispatch issue
      return NextResponse.json({
        success: true,
        warning: "Compte créé mais l'envoi de l'e-mail d'activation a échoué. Veuillez contacter l'administrateur.",
        userId: newUser.id,
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Veuillez vérifier votre e-mail pour activer votre compte.',
      userId: newUser.id,
    }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
