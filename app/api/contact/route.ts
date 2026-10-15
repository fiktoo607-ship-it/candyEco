import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';
import { handleServerError } from '@/lib/api-error-handler';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Veuillez saisir votre nom.').trim(),
  email: z.string().email('Veuillez saisir une adresse e-mail valide.').trim(),
  phone: z.string().optional().nullable(),
  message: z.string().min(1, 'Veuillez rédiger un message.').trim(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(`contact:${clientIp}`, {
      keyPrefix: 'contact-submission',
      limit: 10,
      windowSeconds: 60,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop de tentatives d\'envoi. Veuillez patienter avant de réessayer.'
      );
    }

    const body = await request.json();
    const validationResult = contactSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données de formulaire invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, message } = validationResult.data;

    await sendContactEmail({
      name,
      email,
      phone: phone || undefined,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'Votre message a été envoyé avec succès.',
    });
  } catch (error) {
    return handleServerError(
      error,
      '[Contact API]',
      'Une erreur est survenue lors de l\'envoi de votre message.'
    );
  }
}
