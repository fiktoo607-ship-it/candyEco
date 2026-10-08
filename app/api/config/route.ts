import { NextRequest, NextResponse } from 'next/server';
import { getAllSiteConfigs, saveSiteConfig } from '@/lib/config';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleServerError } from '@/lib/api-error-handler';

export const ALLOWED_CONFIG_KEYS = new Set([
  'carousel_products',
  'carousel_max_slides',
  'new_products_limit',
  'homepage_story_title',
  'homepage_story_description',
  'homepage_story_image',
  'about_hero_title',
  'about_hero_description',
  'about_heritage_image',
  'about_heritage_title',
  'about_heritage_desc1',
  'about_heritage_desc2',
  'contact_phone',
  'contact_email',
  'contact_address',
  'contact_hours',
  'contact_social_instagram',
  'contact_social_instagram_user',
  'contact_social_tiktok',
  'contact_social_tiktok_user',
  'store_enabled',
  'store_message',
  'fidelity_vip_threshold',
  'vipThreshold',
  'fidelity_fidele_threshold',
  'fideleThreshold',
]);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getAllSiteConfigs();

    // Ensure sensitive secret keys are never exposed publicly (Issue #40)
    const SENSITIVE_KEY_PATTERNS = [
      /secret/i,
      /token/i,
      /password/i,
      /credential/i,
      /api_key/i,
      /private/i,
      /smtp/i,
      /database/i,
    ];

    const sanitizedConfig: Record<string, any> = {};
    for (const [k, v] of Object.entries(config)) {
      if (!SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(k))) {
        sanitizedConfig[k] = v;
      }
    }

    return NextResponse.json(sanitizedConfig);
  } catch (error) {
    return handleServerError(error, '[Config API] Error getting config:', 'Failed to retrieve website configurations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Enforce strict allowlist of editable keys (Issue #40)
    const invalidKeys = Object.keys(body).filter((key) => !ALLOWED_CONFIG_KEYS.has(key));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Clé(s) de configuration non autorisée(s) : ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }
    
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

    // Validate fidelity thresholds if present in config update
    const rawVip = body.fidelity_vip_threshold !== undefined ? body.fidelity_vip_threshold : body.vipThreshold;
    const rawFidele = body.fidelity_fidele_threshold !== undefined ? body.fidelity_fidele_threshold : body.fideleThreshold;

    if (rawVip !== undefined || rawFidele !== undefined) {
      const currentConfig = await getAllSiteConfigs();
      const currentVip = currentConfig.fidelity_vip_threshold !== undefined
        ? parseInt(String(currentConfig.fidelity_vip_threshold), 10)
        : (currentConfig.vipThreshold !== undefined ? parseInt(String(currentConfig.vipThreshold), 10) : 500);
      const currentFidele = currentConfig.fidelity_fidele_threshold !== undefined
        ? parseInt(String(currentConfig.fidelity_fidele_threshold), 10)
        : (currentConfig.fideleThreshold !== undefined ? parseInt(String(currentConfig.fideleThreshold), 10) : 100);

      let parsedVip = currentVip;
      if (rawVip !== undefined) {
        parsedVip = Number(rawVip);
        if (isNaN(parsedVip) || !Number.isFinite(parsedVip) || parsedVip <= 0 || !Number.isInteger(parsedVip)) {
          return NextResponse.json(
            { error: 'Le seuil VIP doit être un entier strictement positif.' },
            { status: 400 }
          );
        }
      }

      let parsedFidele = currentFidele;
      if (rawFidele !== undefined) {
        parsedFidele = Number(rawFidele);
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
    }

    // Save configurations
    for (const key of Object.keys(body)) {
      await saveSiteConfig(key, body[key]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServerError(error, '[Config API] Error saving config:', 'Failed to save configurations');
  }
}
