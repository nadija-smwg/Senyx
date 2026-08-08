import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { upload, listByOwner } from '@/server/services/document.service';

export async function POST(request: NextRequest) {
  try {
    const ctx = await withAuth(request);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ownerType = formData.get('ownerType') as string;
    const ownerId = formData.get('ownerId') as string;

    if (!file || !ownerType || !ownerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // In a real app we'd pass proper request context info for audit logging
    ctx.apiRoute = 'POST /api/documents';

    const document = await upload(
      ctx,
      buffer,
      file.name,
      file.type,
      file.size,
      ownerType,
      ownerId
    );

    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await withAuth(request);
    
    const { searchParams } = new URL(request.url);
    const ownerType = searchParams.get('ownerType');
    const ownerId = searchParams.get('ownerId');

    if (!ownerType || !ownerId) {
      return NextResponse.json({ error: 'Missing ownerType or ownerId' }, { status: 400 });
    }

    ctx.apiRoute = 'GET /api/documents';

    const documents = await listByOwner(ctx, ownerType, ownerId);
    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list documents' },
      { status: 500 }
    );
  }
}
