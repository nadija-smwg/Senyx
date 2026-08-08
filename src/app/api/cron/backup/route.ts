import { NextResponse, NextRequest } from 'next/server';
import { verifyAndLogBackup } from '@/server/scripts/backup-db';

export async function POST(request: NextRequest) {
  try {
    // Basic authorization for cron endpoints (e.g. Vercel Cron uses Bearer tokens or custom headers)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // In dev, we might allow it without a secret just for testing, but let's be strict in prod:
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const result = await verifyAndLogBackup();
    
    if (result.success) {
      return NextResponse.json({ success: true, backupId: result.backupId });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Backup cron route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
