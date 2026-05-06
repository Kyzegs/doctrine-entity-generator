import { NextRequest, NextResponse } from 'next/server';
import { getSharedDataServer } from '@/lib/share-server';

// GET /api/share/[code] - Retrieve a shareable link
export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const result = await getSharedDataServer(code);

    if (!result) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    if ('expired' in result) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      data: result.data,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to retrieve shareable link:', error);
    return NextResponse.json({ error: 'Failed to retrieve shareable link' }, { status: 500 });
  }
}
