import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { getDownloadUrl, deleteDocument } from '@/server/services/document.service';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(request);
    ctx.apiRoute = `GET /api/documents/${params.id}`;

    const { url, fileName } = await getDownloadUrl(ctx, params.id);
    
    return NextResponse.json({ success: true, data: { url, fileName } });
  } catch (error: any) {
    console.error('Error generating document URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate URL' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(request);
    ctx.apiRoute = `DELETE /api/documents/${params.id}`;

    await deleteDocument(ctx, params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
