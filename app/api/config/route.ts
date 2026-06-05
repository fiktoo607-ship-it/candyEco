import { NextRequest, NextResponse } from 'next/server';
import { getAllSiteConfigs, saveSiteConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = await getAllSiteConfigs();
    return NextResponse.json(config);
  } catch (error) {
    console.error('[Config API] Error getting config:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve website configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate carousel products limit if present in request
    if (body.carousel_products !== undefined) {
      if (!Array.isArray(body.carousel_products)) {
        return NextResponse.json(
          { error: 'carousel_products must be an array of product slugs' },
          { status: 400 }
        );
      }
      if (body.carousel_products.length > 4) {
        return NextResponse.json(
          { error: 'You can select a maximum of 4 products for the homepage carousel' },
          { status: 400 }
        );
      }
    }

    // Save configurations
    for (const key of Object.keys(body)) {
      await saveSiteConfig(key, body[key]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Config API] Error saving config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save configurations' },
      { status: 500 }
    );
  }
}
