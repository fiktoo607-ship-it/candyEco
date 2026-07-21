import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const vipConfig = await prisma.siteConfig.findUnique({
      where: { key: 'fidelity_vip_threshold' },
    });
    const fideleConfig = await prisma.siteConfig.findUnique({
      where: { key: 'fidelity_fidele_threshold' },
    });

    return NextResponse.json({
      vipThreshold: vipConfig ? parseInt(vipConfig.value) : 500,
      fideleThreshold: fideleConfig ? parseInt(fideleConfig.value) : 100,
    });
  } catch (error) {
    return NextResponse.json({ vipThreshold: 500, fideleThreshold: 100 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vipThreshold, fideleThreshold } = body;

    if (vipThreshold !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: 'fidelity_vip_threshold' },
        update: { value: String(vipThreshold) },
        create: { key: 'fidelity_vip_threshold', value: String(vipThreshold) },
      });
    }

    if (fideleThreshold !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: 'fidelity_fidele_threshold' },
        update: { value: String(fideleThreshold) },
        create: { key: 'fidelity_fidele_threshold', value: String(fideleThreshold) },
      });
    }

    return NextResponse.json({
      success: true,
      vipThreshold: vipThreshold !== undefined ? parseInt(vipThreshold) : 500,
      fideleThreshold: fideleThreshold !== undefined ? parseInt(fideleThreshold) : 100,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Failed to update fidelity config';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
