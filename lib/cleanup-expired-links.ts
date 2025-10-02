import { prisma } from './prisma';

/**
 * Removes all expired shareable links from the database
 */
export async function cleanupExpiredLinks() {
  try {
    const result = await prisma.shareableLink.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired shareable links`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired links:', error);
    throw error;
  }
}
