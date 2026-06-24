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
    
    // Validate carousel products limit and max slides
    let maxSlides = 5;
    if (body.carousel_max_slides !== undefined) {
      maxSlides = parseInt(body.carousel_max_slides, 10);
      if (isNaN(maxSlides) || maxSlides < 1) {
        return NextResponse.json(
          { error: 'Le nombre maximum de diapositives doit être un entier supérieur ou égal à 1.' },
          { status: 400 }
        );
      }
    } else {
      const currentConfig = await getAllSiteConfigs();
      maxSlides = currentConfig.carousel_max_slides || 5;
    }

    // Validate new products section limit
    if (body.new_products_limit !== undefined) {
      const newProductsLimit = parseInt(body.new_products_limit, 10);
      if (isNaN(newProductsLimit) || newProductsLimit < 1) {
        return NextResponse.json(
          { error: 'La limite des nouveaux produits doit être un entier supérieur ou égal à 1.' },
          { status: 400 }
        );
      }
    }

    if (body.carousel_products !== undefined) {
      if (!Array.isArray(body.carousel_products)) {
        return NextResponse.json(
          { error: 'carousel_products must be an array of product slugs' },
          { status: 400 }
        );
      }
      if (body.carousel_products.length > maxSlides) {
        return NextResponse.json(
          { error: `Vous ne pouvez pas sélectionner plus de ${maxSlides} produits pour le carousel.` },
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
