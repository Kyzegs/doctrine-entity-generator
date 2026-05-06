import 'server-only';

import { prisma } from './prisma';
import type { ShareableCode } from './utils';

export type SharedDataServerResult =
  | {
      data: ShareableCode;
      expiresAt: Date;
    }
  | {
      expired: true;
    };

/**
 * Retrieves shared data directly from the database for route handlers and RSC metadata.
 */
export async function getSharedDataServer(code: string): Promise<SharedDataServerResult | null> {
  const shareableLink = await prisma.shareableLink.findUnique({
    where: { code },
  });

  if (!shareableLink) {
    return null;
  }

  if (shareableLink.expiresAt < new Date()) {
    return { expired: true };
  }

  return {
    data: JSON.parse(shareableLink.data) as ShareableCode,
    expiresAt: shareableLink.expiresAt,
  };
}
