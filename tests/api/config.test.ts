import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getConfig, POST as updateConfig } from '@/app/api/config/route';
import { getAllSiteConfigs, saveSiteConfig } from '@/lib/config';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock lib/config
vi.mock('@/lib/config', () => ({
  getAllSiteConfigs: vi.fn(),
  saveSiteConfig: vi.fn(),
  initCmsConfigIfNeeded: vi.fn(),
}));

// Mock next-auth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'admin-uuid', role: 'admin', name: 'Admin', email: 'admin@example.com' },
  }),
}));

describe('Config API', () => {
  const mockConfigs = {
    carousel_products: ['p1', 'p2'],
    carousel_max_slides: 5,
    new_products_limit: 4,
    homepage_story_title: "Histoire",
    homepage_story_image: "https://example.com/image.webp",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllSiteConfigs).mockResolvedValue(mockConfigs);
  });

  describe('GET /api/config', () => {
    it('should retrieve all site configurations for authenticated admin', async () => {
      const response = await getConfig();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual(mockConfigs);
      expect(getAllSiteConfigs).toHaveBeenCalled();
    });

    it('should reject unauthenticated or non-admin callers on GET with 401', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const res = await getConfig();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should strip sensitive secret keys from GET response (Issue #40)', async () => {
      vi.mocked(getAllSiteConfigs).mockResolvedValueOnce({
        carousel_max_slides: 5,
        cloudinary_api_secret: 'super-secret-key',
        database_url: 'postgres://...',
        smtp_password: 'smtp-secret-password',
        contact_phone: '+123456789',
      });

      const res = await getConfig();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.carousel_max_slides).toBe(5);
      expect(data.contact_phone).toBe('+123456789');
      expect(data.cloudinary_api_secret).toBeUndefined();
      expect(data.database_url).toBeUndefined();
      expect(data.smtp_password).toBeUndefined();
    });
  });

  describe('POST /api/config', () => {
    it('should reject unauthenticated or non-admin callers on POST with 401', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({ carousel_max_slides: 5 }),
      });
      const response = await updateConfig(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject disallowed keys in POST /api/config with 400 (Issue #40)', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 5,
          malicious_key: 'hacked',
          secret_token: '123',
        }),
      });
      const response = await updateConfig(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('non autorisée(s)');
      expect(data.error).toContain('malicious_key');
      expect(saveSiteConfig).not.toHaveBeenCalled();
    });

    it('should successfully save valid configurations', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 6,
          new_products_limit: 8,
          homepage_story_title: 'Updated title',
          homepage_story_image: 'https://example.com/new-image.webp',
          store_enabled: false,
          store_message: 'Fermé pour vacances',
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(saveSiteConfig).toHaveBeenCalledWith('carousel_max_slides', 6);
      expect(saveSiteConfig).toHaveBeenCalledWith('new_products_limit', 8);
      expect(saveSiteConfig).toHaveBeenCalledWith('homepage_story_title', 'Updated title');
      expect(saveSiteConfig).toHaveBeenCalledWith('homepage_story_image', 'https://example.com/new-image.webp');
      expect(saveSiteConfig).toHaveBeenCalledWith('store_enabled', false);
      expect(saveSiteConfig).toHaveBeenCalledWith('store_message', 'Fermé pour vacances');
    });

    it('should return 400 when carousel_max_slides is less than 1', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 0,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Le nombre maximum de diapositives doit être un entier supérieur ou égal à 1.');
    });

    it('should return 400 when new_products_limit is less than 1', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          new_products_limit: 0,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('La limite des nouveaux produits doit être un entier supérieur ou égal à 1.');
    });

    it('should return 400 when new_products_limit is not a number', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          new_products_limit: 'invalid',
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('La limite des nouveaux produits doit être un entier supérieur ou égal à 1.');
    });

    it('should return 400 when carousel_products exceeds carousel_max_slides limit', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 2,
          carousel_products: ['slug-1', 'slug-2', 'slug-3'],
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Vous ne pouvez pas sélectionner plus de 2 produits pour le carousel.');
    });

    it('should return 400 when fidelity threshold is negative or zero', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          fidelity_vip_threshold: -100,
          fidelity_fidele_threshold: 50,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('strictement positif');
    });

    it('should return 400 when fidelity VIP threshold is less than or equal to Fidèle threshold (inverted)', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          fidelity_vip_threshold: 100,
          fidelity_fidele_threshold: 200,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Le seuil VIP doit être strictement supérieur au seuil Fidèle.');
    });

    it('should return 400 when fidelity VIP equals Fidèle threshold', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          fidelity_vip_threshold: 100,
          fidelity_fidele_threshold: 100,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Le seuil VIP doit être strictement supérieur au seuil Fidèle.');
    });

    it('should save valid fidelity thresholds when VIP is strictly greater than Fidèle', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          fidelity_vip_threshold: 500,
          fidelity_fidele_threshold: 100,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(saveSiteConfig).toHaveBeenCalledWith('fidelity_vip_threshold', 500);
      expect(saveSiteConfig).toHaveBeenCalledWith('fidelity_fidele_threshold', 100);
    });
  });
});
