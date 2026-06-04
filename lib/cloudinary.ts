import crypto from 'crypto';

const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME || process.env.cloudinaru_name;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || String(process.env.cloudinaru_api_key || '');
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || process.env.cloudinaru_api_secret;

/**
 * Generates a SHA-1 signature for Cloudinary API requests.
 */
function generateSignature(paramsToSign: Record<string, string>, apiSecret: string): string {
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex');
}

/**
 * Extracts a Cloudinary public ID from a full image URL.
 * Supports version numbers and subfolders.
 * 
 * Example:
 * https://res.cloudinary.com/cloud/image/upload/v12345/products/cake.jpg -> products/cake
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;

  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;

    let path = parts[1];

    // Remove the version prefix if present (e.g. v123456789/)
    const versionRegex = /^v\d+\//;
    if (versionRegex.test(path)) {
      path = path.replace(versionRegex, '');
    }

    // Remove file extension (e.g. .jpg, .png, etc.)
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      path = path.substring(0, lastDotIndex);
    }

    return path;
  } catch (error) {
    console.error('[Cloudinary Service] Error parsing Cloudinary URL:', error);
    return null;
  }
}

/**
 * Uploads a file (base64 string, Buffer, or Blob/File) to Cloudinary.
 * Uses secure signature-based uploads.
 */
export async function uploadImage(
  file: string | Buffer | Blob,
  folder = 'products'
): Promise<{ url: string; publicId: string }> {
  if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are missing in .env config');
  }

  // Convert file input to base64 data URI if it's a Buffer or Blob
  let fileString = '';
  if (typeof file === 'string') {
    fileString = file;
  } else if (Buffer.isBuffer(file)) {
    fileString = `data:image/jpeg;base64,${file.toString('base64')}`;
  } else if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fileString = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } else {
    throw new Error('Unsupported file format. Must be string (base64/URL), Buffer, or Blob/File.');
  }

  const timestamp = Math.round(Date.now() / 1000).toString();

  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = generateSignature(paramsToSign, CLOUDINARY_API_SECRET);

  const formData = new FormData();
  formData.append('file', fileString);
  formData.append('folder', folder);
  formData.append('timestamp', timestamp);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = 'Failed to upload image to Cloudinary';
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Deletes an image from Cloudinary using its URL or public ID.
 * Returns the Cloudinary API response status (e.g. "ok" or "not found").
 */
export async function deleteImage(urlOrPublicId: string): Promise<{ result: string }> {
  if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are missing in .env config');
  }

  // Extract public ID if it's a URL, otherwise use the string directly
  const publicId = urlOrPublicId.includes('res.cloudinary.com')
    ? getPublicIdFromUrl(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) {
    console.warn(`[Cloudinary Service] Could not extract public_id from: ${urlOrPublicId}, skipping deletion.`);
    return { result: 'skipped' };
  }

  const timestamp = Math.round(Date.now() / 1000).toString();

  const paramsToSign = {
    public_id: publicId,
    timestamp,
  };

  const signature = generateSignature(paramsToSign, CLOUDINARY_API_SECRET);

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/destroy`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = 'Failed to delete image from Cloudinary';
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  return {
    result: data.result,
  };
}
