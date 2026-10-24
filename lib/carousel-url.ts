/**
 * Security: Carousel Link URL Sanitization & Allowed Scheme/Host Validation (Issue #44)
 * 
 * Protects storefront visitors against:
 * - JavaScript execution (e.g., javascript:alert(1), vbscript:, data:, file:)
 * - Open redirects to unvalidated external phishing or malware domains
 * - Protocol-relative URL redirects (e.g., //evil.com)
 * 
 * Rules:
 * 1. Safe relative internal paths: MUST start with a single '/' and not with '//' or '/\'.
 * 2. Absolute URLs: MUST strictly use 'https:' protocol and belong to trusted allowlisted hosts.
 */

const DEFAULT_TRUSTED_HOSTS = [
  'candyeco.dz',
  'www.candyeco.dz',
  'localhost',
  '127.0.0.1',
];

export function isTrustedCarouselHost(hostname: string): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();

  for (const trusted of DEFAULT_TRUSTED_HOSTS) {
    if (host === trusted || host.endsWith('.' + trusted)) {
      return true;
    }
  }

  // Include configured site origins if specified in environment
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (siteUrl) {
    try {
      const configuredHost = new URL(siteUrl).hostname.toLowerCase();
      if (host === configuredHost || host.endsWith('.' + configuredHost)) {
        return true;
      }
    } catch {
      // Ignore invalid env URL
    }
  }

  return false;
}

export function isValidSlideUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true; // Optional field
  return sanitizeSlideUrl(url) !== null;
}

export function sanitizeSlideUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed === 'about:blank') return null;

  const lower = trimmed.toLowerCase();

  // Block dangerous schemes
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return null;
  }

  // Block protocol-relative URLs (e.g. //evil.com) and backslash traversal (e.g. /\evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\\\')) {
    return null;
  }

  // Allow safe relative internal paths (e.g. /our-product/..., /products/..., /contact)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // For absolute URLs, enforce strictly HTTPS and validate against trusted host allowlist
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' && isTrustedCarouselHost(parsed.hostname)) {
      return trimmed;
    }
  } catch {
    // Malformed URL
  }

  return null;
}
