import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { getHelpSections, searchHelp } from '@/server/services/help.service';

export async function GET(request: NextRequest) {
  try {
    const ctx = await withAuth(request);
    ctx.apiRoute = 'GET /api/help';

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let sections;
    if (query) {
      sections = await searchHelp(ctx, query);
    } else {
      sections = await getHelpSections(ctx);
    }

    return NextResponse.json({ success: true, data: sections });
  } catch (error: any) {
    console.error('Failed to list help sections:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
