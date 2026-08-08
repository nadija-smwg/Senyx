import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  // Create a simple mock file response
  const content = `This is a mock file generated for development mode.
The actual file content is not stored because Cloudflare R2 / S3 was not configured in .env.local.
Original Key: ${key}`;

  return new NextResponse(content, {
    headers: {
      'Content-Disposition': `attachment; filename="mock-file.txt"`,
      'Content-Type': 'text/plain',
    }
  });
}
