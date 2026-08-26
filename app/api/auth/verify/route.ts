import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, {
      keyPrefix: 'verify',
      limit: 10,
      windowSeconds: 900, // 15 minutes
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop de tentatives de vérification. Veuillez réessayer dans quelques minutes.'
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Le jeton de vérification est requis.' }, { status: 400 });
    }

    // Lookup token in DB
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Ce lien d'activation est invalide ou a déjà été utilisé." }, { status: 400 });
    }

    // Check if expired
    if (verificationToken.expires < new Date()) {
      // Remove expired token
      await prisma.verificationToken.delete({
        where: { token },
      }).catch(() => {});

      return NextResponse.json({ error: "Ce lien d'activation a expiré." }, { status: 400 });
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: 'Votre adresse e-mail a été vérifiée avec succès. Vous pouvez maintenant vous connecter.',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Verification failed';
    console.error('Verification API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
