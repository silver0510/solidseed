import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';

// NOTE: This is a test endpoint without authentication
// Once user authentication is implemented (user-authentication epic),
// this will be updated to use real user authentication
const TEST_USER_ID = 'test-user-123';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // Upload file
    const result = await StorageService.uploadFile({
      userId: TEST_USER_ID,
      file,
      folder: 'test-uploads',
    });

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await StorageService.getSignedUrl(result.path, 3600);

    return NextResponse.json({
      success: true,
      data: {
        path: result.path,
        publicUrl: result.url,
        signedUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (error) {
    console.error('Storage upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // Verify file belongs to test user
    if (!filePath.startsWith(TEST_USER_ID)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await StorageService.deleteFile(filePath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Storage delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const files = await StorageService.listFiles(TEST_USER_ID, 'test-uploads');

    return NextResponse.json({
      success: true,
      data: {
        userId: TEST_USER_ID,
        files,
        count: files.length,
      },
    });
  } catch (error) {
    console.error('Storage list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'List failed',
      },
      { status: 500 }
    );
  }
}
