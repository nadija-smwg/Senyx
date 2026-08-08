import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { getHelpSection, updateHelpSection } from '@/server/services/help.service';

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(request);
    ctx.apiRoute = `GET /api/help/${params.slug}`;

    const section = await getHelpSection(ctx, params.slug);
    
    if (!section) {
      return NextResponse.json({ error: 'Help section not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error(`Failed to get help section:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(request);
    ctx.apiRoute = `PUT /api/help/${params.slug}`;

    const body = await request.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    await updateHelpSection(ctx, params.slug, {
      title: body.title,
      content: body.content,
      roles: body.roles
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to update help section:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
