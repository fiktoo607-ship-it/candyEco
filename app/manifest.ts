import type { MetadataRoute } from 'next';
import { THEME_CONFIG } from '@/lib/theme';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: THEME_CONFIG.brand.name,
    short_name: THEME_CONFIG.brand.name,
    description: THEME_CONFIG.brand.description,
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: THEME_CONFIG.colorRoles.dominant60.background,
    theme_color: THEME_CONFIG.colors.primary,
    lang: 'fr',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/logo.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/logo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
      {
        src: '/logo.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
