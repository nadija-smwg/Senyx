import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';

/**
 * GET /api/mock-download
 * Development-only mock file download endpoint.
 * Requires authentication — even mock endpoints must not be public.
 */
export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (error) {
    return handleError(error);
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  // Create a simple mock file response — does NOT reflect key into HTML/script context
  const content = `This is a mock file generated for development mode.\nThe actual file content is not stored because Cloudflare R2 / S3 was not configured.\nOriginal Key: ${key.replace(/[<>&"]/g, '')}`;

  return new NextResponse(content, {
    headers: {
      'Content-Disposition': `attachment; filename="mock-file.txt"`,
      'Content-Type': 'text/plain',
    },
  });
}
