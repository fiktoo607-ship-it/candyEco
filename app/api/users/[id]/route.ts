import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from 'zod';

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

    let defaultScore = existingUser.trustScore ?? 0;
    if (status === 'VIP' && (trustScore === undefined || trustScore < 500)) {
      defaultScore = Math.max(defaultScore, 500);
    } else if (status === 'Fidèle' && (trustScore === undefined || trustScore < 100)) {
      defaultScore = Math.max(defaultScore, 100);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        trustScore: trustScore !== undefined ? trustScore : defaultScore,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Statut du client mis à jour avec succès.',
      user: updatedUser,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Update failed';
    console.error('Update User API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Deletion failed';
    console.error('Delete User API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
