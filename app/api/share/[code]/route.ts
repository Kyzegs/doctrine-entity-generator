import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/share/[code] - Retrieve a shareable link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // Find the shareable link
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { code },
    });
    
    if (!shareableLink) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }
    
    // Check if the link has expired
    if (new Date() > shareableLink.expiresAt) {
      // Delete expired link
      await prisma.shareableLink.delete({
        where: { code },
      });
      
      return NextResponse.json(
        { error: 'Link has expired' },
        { status: 410 } // 410 Gone
      );
    }
    
    // Return the data
    return NextResponse.json({
      data: JSON.parse(shareableLink.data),
      expiresAt: shareableLink.expiresAt,
    });
  } catch (error) {
    console.error('Failed to retrieve shareable link:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shareable link' },
      { status: 500 }
    );
  }
}

