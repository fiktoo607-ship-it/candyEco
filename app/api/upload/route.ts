import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided or invalid file format' },
        { status: 400 }
      );
    }

    const folder = (formData.get('folder') as string) || 'products';

    // Call Cloudinary helper
    const result = await uploadImage(file, folder);

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    console.error('[Upload API] Error uploading file:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
