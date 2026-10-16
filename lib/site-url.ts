/**
 * Resolves the canonical base URL for the application.
 * Priority: NEXT_PUBLIC_SITE_URL -> NEXTAUTH_URL -> http://localhost:3000
 */
export function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';

  return url.replace(/\/$/, '');
}
