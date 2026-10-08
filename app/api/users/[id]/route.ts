import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from 'zod';
import { handleServerError } from '@/lib/api-error-handler';
import { getFidelityThresholds } from '@/app/api/fidelity-config/route';

const updateUserSchema = z.object({
  status: z.enum(['VIP', 'Fidèle', 'Vérifié', 'Non vérifié']).optional(),
  trustScore: z
    .union([
      z.number().int().min(0, 'Le score de confiance ne peut pas être négatif'),
      z.string().regex(/^\d+$/, 'Le score de confiance doit être un entier positif').transform(Number)
    ])
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, trustScore } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    const { vipThreshold, fideleThreshold } = await getFidelityThresholds();

    let defaultScore = existingUser.trustScore ?? 0;
    if (status === 'VIP' && (trustScore === undefined || trustScore < vipThreshold)) {
      defaultScore = Math.max(defaultScore, vipThreshold);
    } else if (status === 'Fidèle' && (trustScore === undefined || trustScore < fideleThreshold)) {
      defaultScore = Math.max(defaultScore, fideleThreshold);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        trustScore: trustScore !== undefined ? trustScore : defaultScore,
      },
    });

    // Exclude password hash from response (Issue #6)
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      message: 'Statut du client mis à jour avec succès.',
      user: userWithoutPassword,
    });
  } catch (error) {
    return handleServerError(error, 'Update User API Error:', 'Update failed');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    // Prevent deleting other admin accounts (Issue #45)
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un compte administrateur.' },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès.' });

  } catch (error) {
    return handleServerError(error, 'Delete User API Error:', 'Deletion failed');
  }
}
