import fs from 'fs';
import path from 'path';
import { THEME_CONFIG } from './theme';
import { prisma } from './prisma';

const getFilePath = () => path.join(process.cwd(), 'lib', 'copy-dictionary.json');

export function getDictionary() {
  const filePath = getFilePath();
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function saveDictionary(data: any) {
  const filePath = getFilePath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Default configuration fallbacks
export const DEFAULT_CONFIGS: Record<string, any> = {
  carousel_products: [
    'chakhchoukhat-dfer',
    'tajine-zitoun-avec-khobz-el-dar',
    'sables-a-la-confiture',
    'dziriettes'
  ],
  carousel_max_slides: 5,
  new_products_limit: 4,
  homepage_story_title: "Fait Main, sans Raccourci",
  homepage_story_description: "Nous cuisons avec la rigueur de l'artisanat : fermentation lente, ingrédients d'exception et cuisson précise. Le résultat ? Des créations authentiques au goût incomparable.",
  
  about_hero_title: "Un voyage ancré dans la passion et la tradition",
  about_hero_description: "Tout a commencé dans un petit atelier fariné où l'air embaumait constamment la levure et le beurre caramélisé. Nous croyons que le véritable artisanat demande du temps.",
  about_heritage_title: "Héritage Boulanger",
  about_heritage_desc1: "Nous ne faisons pas que cuire du pain ; nous créons des expériences. En honorant les techniques ancestrales tout en y apportant une touche de créativité moderne, nous confectionnons des gourmandises à la fois réconfortantes et inattendues.",
  about_heritage_desc2: "Nourrir le levain naturel, feuilleter les viennoiseries avec précision et façonner chaque miche à la main sont les détails qui donnent à nos créations leur caractère unique.",

  contact_phone: THEME_CONFIG.brand.contact.phone,
  contact_email: THEME_CONFIG.brand.contact.email,
  contact_address: THEME_CONFIG.brand.contact.address,
  contact_hours: THEME_CONFIG.brand.contact.hours,

  contact_social_instagram: THEME_CONFIG.brand.contact.socialLinks.find(l => l.label === 'Instagram')?.href || 'https://www.instagram.com/lesdelices.d.eva?igsh=aDQwZGYyMXNpeG5n',
  contact_social_instagram_user: THEME_CONFIG.brand.contact.socialLinks.find(l => l.label === 'Instagram')?.username || 'lesdelices.d.eva',
  contact_social_tiktok: THEME_CONFIG.brand.contact.socialLinks.find(l => l.label === 'TikTok')?.href || 'https://www.tiktok.com/@les.delices.d.eva?_r=1&_t=ZS-96y0UWvpi3o',
  contact_social_tiktok_user: THEME_CONFIG.brand.contact.socialLinks.find(l => l.label === 'TikTok')?.username || 'les.delices.d.eva',
  store_enabled: true,
  store_message: "Le magasin est temporairement fermé."
};

export const CMS_MAP: Record<string, string> = {
  carousel_products: 'cms.carousel_products',
  carousel_max_slides: 'cms.carousel_max_slides',
  new_products_limit: 'cms.new_products_limit',
  homepage_story_title: 'home.story.title',
  homepage_story_description: 'home.story.description',
  about_hero_title: 'about.hero.title',
  about_hero_description: 'about.hero.description',
  about_heritage_title: 'about.heritage.title',
  about_heritage_desc1: 'about.heritage.description1',
  about_heritage_desc2: 'about.heritage.description2',
  contact_phone: 'contact.visit.phone_value',
  contact_address: 'contact.visit.address_value',
  contact_hours: 'contact.visit.hours_value',
  contact_email: 'contact.visit.email_value',
  contact_social_instagram: 'contact.social.instagram',
  contact_social_instagram_user: 'contact.social.instagram_user',
  contact_social_tiktok: 'contact.social.tiktok',
  contact_social_tiktok_user: 'contact.social.tiktok_user',
  store_enabled: 'cms.store_enabled',
  store_message: 'cms.store_message',
};

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

export function initCmsConfigIfNeeded() {
  const dict = getDictionary();
  let modified = false;

  for (const key of Object.keys(CMS_MAP)) {
    const path = CMS_MAP[key];
    const currentVal = getNestedValue(dict, path);
    if (currentVal === undefined) {
      setNestedValue(dict, path, DEFAULT_CONFIGS[key]);
      modified = true;
    }
  }

  // Ensure cms object and carousel_products exist
  if (!dict.cms) {
    dict.cms = {};
    modified = true;
  }
  if (!dict.cms.carousel_products) {
    dict.cms.carousel_products = DEFAULT_CONFIGS.carousel_products;
    modified = true;
  }

  if (modified) {
    saveDictionary(dict);
  }
  return dict;
}

/**
 * Retrieves a site configuration value by key, falling back to static defaults.
 */
export async function getSiteConfig<T>(key: string): Promise<T> {
  try {
    const dbConfig = await prisma.siteConfig.findUnique({
      where: { key },
    });
    if (dbConfig) {
      return JSON.parse(dbConfig.value) as T;
    }
  } catch (dbError) {
    console.error(`[Config Service] Database error reading key "${key}":`, dbError);
  }

  try {
    const dict = initCmsConfigIfNeeded();
    const path = CMS_MAP[key];
    if (path) {
      const val = getNestedValue(dict, path);
      if (val !== undefined) {
        return val as T;
      }
    }
  } catch (error) {
    console.error(`[Config Service] File error reading key "${key}":`, error);
  }
  return DEFAULT_CONFIGS[key] as T;
}

/**
 * Saves or updates a site configuration key with value.
 */
export async function saveSiteConfig(key: string, value: any): Promise<void> {
  try {
    await prisma.siteConfig.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  } catch (dbError) {
    console.error(`[Config Service] Database error saving key "${key}":`, dbError);
  }

  try {
    const dict = initCmsConfigIfNeeded();
    const path = CMS_MAP[key];
    if (path) {
      setNestedValue(dict, path, value);
      saveDictionary(dict);
    }
  } catch (error) {
    console.warn(`[Config Service] Skip local file write for key "${key}" (expected in read-only Serverless environments)`);
  }
}

/**
 * Retrieves the complete set of configurations.
 */
export async function getAllSiteConfigs(): Promise<Record<string, any>> {
  const configs: Record<string, any> = {};
  
  try {
    const dbConfigs = await prisma.siteConfig.findMany();
    const dbMap: Record<string, any> = {};
    for (const item of dbConfigs) {
      try {
        dbMap[item.key] = JSON.parse(item.value);
      } catch {
        dbMap[item.key] = item.value;
      }
    }

    let dict: any = {};
    try {
      dict = initCmsConfigIfNeeded();
    } catch {
      // Ignore read-only file system issues during initialization
    }

    for (const key of Object.keys(DEFAULT_CONFIGS)) {
      if (dbMap[key] !== undefined) {
        configs[key] = dbMap[key];
      } else {
        const path = CMS_MAP[key];
        const val = path ? getNestedValue(dict, path) : undefined;
        configs[key] = val !== undefined ? val : DEFAULT_CONFIGS[key];
      }
    }
  } catch (error) {
    console.error('[Config Service] Error reading all configurations, using defaults:', error);
    return { ...DEFAULT_CONFIGS };
  }
  
  return configs;
}

/**
 * Reads the dictionary file and overlays values from the database SiteConfig.
 * This ensures serverless environments reflect dynamic config changes.
 */
export async function getDictionaryWithDbOverrides() {
  let dict: any = {};
  try {
    dict = getDictionary();
  } catch (err) {
    console.error('[Config Service] Failed to read static dictionary file:', err);
  }

  try {
    const dbConfigs = await prisma.siteConfig.findMany();
    for (const item of dbConfigs) {
      const path = CMS_MAP[item.key];
      if (path) {
        try {
          const parsedValue = JSON.parse(item.value);
          setNestedValue(dict, path, parsedValue);
        } catch {
          setNestedValue(dict, path, item.value);
        }
      }
    }
  } catch (dbError) {
    console.error('[Config Service] Failed to overlay database configs on dictionary:', dbError);
  }

  return dict;
}
