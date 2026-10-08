import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as uploadFile } from '@/app/api/upload/route';
import { uploadImage } from '@/lib/cloudinary';
import { NextRequest } from 'next/server';

// Mock Cloudinary service helper
vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  getPublicIdFromUrl: vi.fn(),
}));

// Mock next-auth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'admin-uuid', role: 'admin', name: 'Admin', email: 'admin@example.com' },
  }),
}));

import { resetRateLimiter } from '@/lib/rate-limiter';

describe('Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
  });

  it('should upload a valid file to Cloudinary and return URL and public ID', async () => {
    const mockUploadResult = {
      url: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/uploaded-cookie.jpg',
      publicId: 'products/uploaded-cookie',
    };

    vi.mocked(uploadImage).mockResolvedValueOnce(mockUploadResult);

    const formData = new FormData();
    const mockFile = new Blob(['fake-image-binary-data'], { type: 'image/jpeg' });
    formData.append('file', mockFile);
    formData.append('folder', 'custom-folder');

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadFile(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(mockUploadResult);

    expect(uploadImage).toHaveBeenCalledWith(expect.any(Blob), 'custom-folder');
  });

  it('should use default folder "products" if no folder is provided', async () => {
    const mockUploadResult = {
      url: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/cookie.jpg',
      publicId: 'products/cookie',
    };

    vi.mocked(uploadImage).mockResolvedValueOnce(mockUploadResult);

    const formData = new FormData();
    const mockFile = new Blob(['fake-image'], { type: 'image/png' });
    formData.append('file', mockFile);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadFile(req);
    expect(response.status).toBe(200);
    expect(uploadImage).toHaveBeenCalledWith(expect.any(Blob), 'products');
  });

  it('should return 400 when no file is provided', async () => {
    const formData = new FormData();
    formData.append('folder', 'products');

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadFile(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toEqual({ error: 'No file provided or invalid file format' });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('should return 400 when file field is not a Blob', async () => {
    const formData = new FormData();
    formData.append('file', 'just-a-string-not-a-file');

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadFile(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toEqual({ error: 'No file provided or invalid file format' });
  });

  it('should return 500 when Cloudinary helper fails', async () => {
    vi.mocked(uploadImage).mockRejectedValueOnce(new Error('Cloudinary authorization failed'));

    const formData = new FormData();
    const mockFile = new Blob(['image-bytes'], { type: 'image/jpeg' });
    formData.append('file', mockFile);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadFile(req);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: 'Cloudinary authorization failed' });
  });

  describe('Security Hardening (Issues #44, #18)', () => {
    it('should reject path-traversing or unapproved folder names with 400', async () => {
      const invalidFolders = ['../../secrets', '../products', 'products/subfolder', 'etc/passwd', 'invalid_folder'];

      for (const folder of invalidFolders) {
        const formData = new FormData();
        const mockFile = new Blob(['image-bytes'], { type: 'image/jpeg' });
        formData.append('file', mockFile);
        formData.append('folder', folder);

        const req = new NextRequest('http://localhost/api/upload', {
          method: 'POST',
          body: formData,
        });

        const response = await uploadFile(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Dossier de destination non autorisé');
      }
    });

    it('should reject non-image or executable MIME types (.php, .exe, .sh) with 400', async () => {
      const invalidMimeTypes = ['application/x-php', 'application/x-msdownload', 'text/x-sh', 'application/javascript', 'text/html'];

      for (const mimeType of invalidMimeTypes) {
        const formData = new FormData();
        const mockFile = new Blob(['malicious-script-content'], { type: mimeType });
        formData.append('file', mockFile);
        formData.append('folder', 'products');

        const req = new NextRequest('http://localhost/api/upload', {
          method: 'POST',
          body: formData,
        });

        const response = await uploadFile(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Format de fichier non autorisé');
      }
    });

    it('should reject files exceeding the 5MB size limit with 400', async () => {
      const formData = new FormData();
      // 6MB buffer
      const largeBuffer = new Uint8Array(6 * 1024 * 1024);
      const mockFile = new Blob([largeBuffer], { type: 'image/jpeg' });
      formData.append('file', mockFile);
      formData.append('folder', 'products');

      const req = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadFile(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('taille du fichier dépasse');
    });

    it('should reject files with executable extensions (.php, .exe, .sh) with 400', async () => {
      const maliciousFiles = ['payload.php', 'virus.exe', 'script.sh'];

      for (const fileName of maliciousFiles) {
        const formData = new FormData();
        const mockFile = new File(['echo malicious'], fileName, { type: 'image/jpeg' });
        formData.append('file', mockFile);
        formData.append('folder', 'products');

        const req = new NextRequest('http://localhost/api/upload', {
          method: 'POST',
          body: formData,
        });

        const response = await uploadFile(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Type de fichier exécutable interdit');
      }
    });
  });
});
