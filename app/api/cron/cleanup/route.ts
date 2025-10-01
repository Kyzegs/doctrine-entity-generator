import { NextResponse } from 'next/server';
import { cleanupExpiredLinks } from '@/lib/cleanup-expired-links';

export async function GET() {
  try {
    console.log('Starting scheduled cleanup of expired links...');
    const count = await cleanupExpiredLinks();
    
    return NextResponse.json({ 
      message: `Cron job completed successfully. Cleaned up ${count} expired links.`,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cron cleanup job:', error);
    return NextResponse.json({ 
      error: 'Failed to run cleanup job',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
