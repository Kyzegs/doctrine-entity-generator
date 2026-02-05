import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GenerationOptions, GeneratedEntity, ShareableConfiguration } from './types';
import { prisma } from './prisma';

/**
 * Extract a user-facing error message from an unknown error.
 */
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Compute entity class name from options and table name.
 * Uses options.entityName if set, otherwise prefix + PascalCase(tableName) + suffix.
 */
export function computeEntityName(
  options: Pick<GenerationOptions, 'entityName' | 'entityPrefix' | 'entitySuffix'>,
  tableName: string
): string {
  if (options.entityName?.trim()) return options.entityName.trim();
  return options.entityPrefix + toPascalCase(tableName) + options.entitySuffix;
}

/** Option keys that are persisted/shared (excludes entityName, relationships, etc.). */
type ShareableOptionKey = keyof Pick<
  GenerationOptions,
  | 'namespace'
  | 'entityPrefix'
  | 'entitySuffix'
  | 'customDataTypes'
  | 'columnFieldMappings'
  | 'explicitlyDefineColumns'
  | 'useAttributeMapping'
  | 'customTraits'
>;
const SHAREABLE_OPTION_KEYS: ShareableOptionKey[] = [
  'namespace',
  'entityPrefix',
  'entitySuffix',
  'customDataTypes',
  'columnFieldMappings',
  'explicitlyDefineColumns',
  'useAttributeMapping',
  'customTraits',
];

/**
 * Build shareable configuration from current options (for export and for localStorage).
 */
export function buildShareableConfiguration(options: GenerationOptions): ShareableConfiguration {
  const partial = SHAREABLE_OPTION_KEYS.reduce(
    (acc, key) => {
      acc[key] = options[key];
      return acc;
    },
    {} as Record<string, unknown>
  );
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    ...partial,
  } as ShareableConfiguration;
}

/**
 * Merge shareable config (e.g. from localStorage or import) into partial options.
 * Returns an object with only the shareable keys set; use with spread over DEFAULT_OPTIONS.
 */
export function mergeShareableConfigIntoOptions(
  parsed: Partial<ShareableConfiguration>
): Partial<Pick<GenerationOptions, ShareableOptionKey>> {
  return SHAREABLE_OPTION_KEYS.reduce(
    (acc, key) => {
      if (parsed[key] !== undefined) acc[key] = parsed[key] as never;
      return acc;
    },
    {} as Record<string, unknown>
  ) as Partial<Pick<GenerationOptions, ShareableOptionKey>>;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Share utilities – normalized: always an array of entities; UI decides single vs bulk display
export interface ShareableCode {
  entities: GeneratedEntity[];
  sqlInput?: string;
  options?: Partial<GenerationOptions>;
  timestamp?: string;
}

export interface ShareResponse {
  code: string;
  expiresAt: string;
}

export interface ShareDataResponse {
  data: ShareableCode;
  expiresAt: string;
}

/**
 * Creates a shareable link by storing data in the database
 */
export async function createShareUrl(data: ShareableCode): Promise<string> {
  const shareData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    const result: ShareResponse = await response.json();

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return `${baseUrl}/share/${result.code}`;
  } catch (error) {
    console.error('Failed to create share link:', error);
    throw new Error('Failed to create share link');
  }
}

export type GetSharedDataResult = { data: ShareableCode; expiresAt: Date } | { expired: true } | null;

/**
 * Retrieves shared data from the database (server-side).
 * Returns { data, expiresAt } when found and valid, { expired: true } when found but expired (and deletes it), null when not found.
 */
export async function getSharedDataServer(code: string): Promise<GetSharedDataResult> {
  try {
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { code },
    });

    if (!shareableLink) {
      return null;
    }

    if (new Date() > shareableLink.expiresAt) {
      await prisma.shareableLink.delete({
        where: { code },
      });
      return { expired: true };
    }

    return {
      data: JSON.parse(shareableLink.data) as ShareableCode,
      expiresAt: shareableLink.expiresAt,
    };
  } catch (error) {
    console.error('Failed to retrieve shared data:', error);
    return null;
  }
}

/**
 * Retrieves shared data from the database (client-side)
 */
export async function getSharedData(code: string): Promise<ShareableCode> {
  try {
    const response = await fetch(`/api/share/${code}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Link not found');
      }
      if (response.status === 410) {
        throw new Error('Link has expired');
      }
      throw new Error('Failed to retrieve shared data');
    }

    const result: ShareDataResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to retrieve shared data:', error);
    throw error;
  }
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  await navigator.clipboard.writeText(text);
}

/**
 * Converts snake_case to PascalCase
 * Example: billing_address -> BillingAddress
 */
export function toPascalCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Converts snake_case to camelCase
 * Example: billing_address -> billingAddress
 */
export function toCamelCase(str: string): string {
  const pascalCase = toPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}
