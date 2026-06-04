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

describe('Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
