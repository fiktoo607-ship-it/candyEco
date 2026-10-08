import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getFidelityThresholds(): Promise<{ vipThreshold: number; fideleThreshold: number }> {
  try {
    const vipConfig = await prisma.siteConfig.findUnique({
      where: { key: 'fidelity_vip_threshold' },
    });
    const fideleConfig = await prisma.siteConfig.findUnique({
      where: { key: 'fidelity_fidele_threshold' },
    });

    return {
      vipThreshold: vipConfig ? parseInt(vipConfig.value, 10) : 500,
      fideleThreshold: fideleConfig ? parseInt(fideleConfig.value, 10) : 100,
    };
  } catch (error) {
    return { vipThreshold: 500, fideleThreshold: 100 };
  }
}

export async function GET() {
  const thresholds = await getFidelityThresholds();
  return NextResponse.json(thresholds);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vipThreshold, fideleThreshold } = body;

    if (vipThreshold === undefined && fideleThreshold === undefined) {
      return NextResponse.json(
        { error: 'Au moins un seuil de fidélité doit être spécifié.' },
        { status: 400 }
      );
    }

    // Retrieve current configuration for relative comparison
    const vipConfig = await prisma.siteConfig.findUnique({
      where: { key: 'fidelity_vip_threshold' },
    });
    const fideleConfig = await prisma.siteConfig.findUnique({
      where: { key: 'fidelity_fidele_threshold' },
    });

    const currentVip = vipConfig ? parseInt(vipConfig.value, 10) : 500;
    const currentFidele = fideleConfig ? parseInt(fideleConfig.value, 10) : 100;

    let parsedVip = currentVip;
    if (vipThreshold !== undefined) {
      parsedVip = Number(vipThreshold);
      if (isNaN(parsedVip) || !Number.isFinite(parsedVip) || parsedVip <= 0 || !Number.isInteger(parsedVip)) {
        return NextResponse.json(
          { error: 'Le seuil VIP doit être un entier strictement positif.' },
          { status: 400 }
        );
      }
    }

    let parsedFidele = currentFidele;
    if (fideleThreshold !== undefined) {
      parsedFidele = Number(fideleThreshold);
      if (isNaN(parsedFidele) || !Number.isFinite(parsedFidele) || parsedFidele <= 0 || !Number.isInteger(parsedFidele)) {
        return NextResponse.json(
          { error: 'Le seuil Fidèle doit être un entier strictement positif.' },
          { status: 400 }
        );
      }
    }

    if (parsedVip <= parsedFidele) {
      return NextResponse.json(
        { error: 'Le seuil VIP doit être strictement supérieur au seuil Fidèle.' },
        { status: 400 }
      );
    }

    if (vipThreshold !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: 'fidelity_vip_threshold' },
        update: { value: String(parsedVip) },
        create: { key: 'fidelity_vip_threshold', value: String(parsedVip) },
      });
    }

    if (fideleThreshold !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: 'fidelity_fidele_threshold' },
        update: { value: String(parsedFidele) },
        create: { key: 'fidelity_fidele_threshold', value: String(parsedFidele) },
      });
    }

    return NextResponse.json({
      success: true,
      vipThreshold: parsedVip,
      fideleThreshold: parsedFidele,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Failed to update fidelity config';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
