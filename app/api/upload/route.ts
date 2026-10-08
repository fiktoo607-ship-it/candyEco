import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { handleServerError } from '@/lib/api-error-handler';

export const ALLOWED_UPLOAD_FOLDERS = new Set([
  'products',
  'banners',
  'avatars',
  'carousel',
  'slides',
  'custom-folder',
]);

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const identifier = session?.user?.id ? `user:${session.user.id}` : `ip:${clientIp}`;
    const rateLimitResult = await checkRateLimit(identifier, {
      keyPrefix: 'upload',
      limit: 10,
      windowSeconds: 60,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop de téléversements. Veuillez patienter une minute avant de réessayer.'
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided or invalid file format' },
        { status: 400 }
      );
    }

    // Validate destination directory against path traversal and allowlist (Issue #44)
    const rawFolder = formData.get('folder');
    const folder = (typeof rawFolder === 'string' && rawFolder.trim() ? rawFolder.trim() : 'products');

    if (
      folder.includes('..') ||
      folder.includes('/') ||
      folder.includes('\\') ||
      !ALLOWED_UPLOAD_FOLDERS.has(folder)
    ) {
      return NextResponse.json(
        { error: 'Dossier de destination non autorisé ou invalide' },
        { status: 400 }
      );
    }

    // Validate MIME type (Issue #18)
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non autorisé. Formats acceptés : image/jpeg, image/png, image/webp.' },
        { status: 400 }
      );
    }

    // Enforce strict file size ceiling (max 5MB)
    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      return NextResponse.json(
        { error: 'La taille du fichier dépasse la limite autorisée de 5 Mo.' },
        { status: 400 }
      );
    }

    // Reject dangerous executable extensions
    if ('name' in file && typeof (file as any).name === 'string') {
      const fileName = ((file as any).name as string).toLowerCase();
      const dangerousExtensions = ['.php', '.exe', '.sh', '.bat', '.cmd', '.js', '.ts', '.py', '.phtml', '.phar'];
      if (dangerousExtensions.some((ext) => fileName.endsWith(ext))) {
        return NextResponse.json(
          { error: 'Type de fichier exécutable interdit.' },
          { status: 400 }
        );
      }
    }

    // Call Cloudinary helper
    const result = await uploadImage(file, folder);

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    return handleServerError(error, '[Upload API] Error uploading file:', 'Failed to upload file');
  }
}
