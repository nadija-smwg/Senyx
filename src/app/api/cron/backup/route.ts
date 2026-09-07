import { NextResponse, NextRequest } from 'next/server';
import { verifyAndLogBackup } from '@/server/scripts/backup-db';

export async function POST(request: NextRequest) {
  try {
    // Unconditional authorization — CRON_SECRET must always be set
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
