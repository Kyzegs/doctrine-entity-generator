import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// POST /api/share - Create a new shareable link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate a short, unique code
    const code = nanoid(10);
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Create the shareable link in the database
    const shareableLink = await prisma.shareableLink.create({
      data: {
        code,
        data: JSON.stringify(body),
        expiresAt,
      },
    });
    
    return NextResponse.json({
      code: shareableLink.code,
      expiresAt: shareableLink.expiresAt,
    });
  } catch (error) {
    console.error('Failed to create shareable link:', error);
    return NextResponse.json(
      { error: 'Failed to create shareable link' },
      { status: 500 }
    );
  }
}
