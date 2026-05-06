import type { Metadata } from 'next';
import { getSharedDataServer } from '@/lib/share-server';
import { toPascalCase, ShareableCode } from '@/lib/utils';
import { SQLParser } from '@/lib/sql-parser';
import { DatabaseDialect } from '@/lib/example-queries';
import { SharedCodeClient } from './shared-code-client';

/**
 * Extract entity name from shared data (normalized: entities array)
 */
function extractEntityInfo(sharedData: ShareableCode): {
  entityName: string;
  tableName: string;
  codeTypes: string[];
} {
  let entityName = 'Entity';
  let tableName = 'table';
  const codeTypes: string[] = [];
  const first = sharedData.entities[0];

  if (first) {
    entityName = first.entityName;
    tableName = first.tableName;
    if (first.phpOutput) codeTypes.push('PHP Entity');
    if (first.phpEnumOutputs?.length) codeTypes.push('PHP Enums');
    if (first.xmlOutput) codeTypes.push('XML Mapping');
  }

  if (sharedData.sqlInput) {
    codeTypes.push('SQL');
    if (entityName === 'Entity' || tableName === 'table') {
      try {
        const dialect = sharedData.options?.databaseDialect || DatabaseDialect.MYSQL;
        const schema = SQLParser.parseCreateTable(sharedData.sqlInput, dialect);
        tableName = schema.name;
        if (entityName === 'Entity') {
          if (sharedData.options?.entityName) {
            entityName = sharedData.options.entityName;
          } else {
            const prefix = sharedData.options?.entityPrefix ?? '';
            const suffix = sharedData.options?.entitySuffix ?? '';
            entityName = `${prefix}${toPascalCase(tableName)}${suffix}`;
          }
        }
      } catch {
        const tableMatch = sharedData.sqlInput.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?(\w+)`?|(\w+))/i);
        if (tableMatch) {
          tableName = tableMatch[1] || tableMatch[2] || 'table';
        }
      }
    }
  }

  if (sharedData.entities.length > 1) {
    codeTypes.push(`${sharedData.entities.length} Entities`);
  }

  return { entityName, tableName, codeTypes };
}

/**
 * Generate metadata for shared code pages
 */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const result = await getSharedDataServer(code);

  if (!result) {
    return {
      title: 'Shared Code Not Found',
      description: 'The shared Doctrine entity code could not be found.',
      robots: { index: false, follow: false },
    };
  }
  if ('expired' in result) {
    return {
      title: 'Shared Link Expired',
      description: 'This share link has expired (15 minutes limit).',
      robots: { index: false, follow: false },
    };
  }

  const sharedData = result.data;
  const { entityName, tableName, codeTypes } = extractEntityInfo(sharedData);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://entity-generator.vercel.app';
  const shareUrl = `${siteUrl}/share/${code}`;

  const description = `View shared Doctrine entity code for ${entityName}${tableName !== 'table' ? ` (table: ${tableName})` : ''}. Includes: ${codeTypes.join(', ')}.`;

  return {
    title: `Shared: ${entityName}`,
    description,
    keywords: ['doctrine', 'doctrine orm', 'php entity', 'shared code', entityName, tableName, ...codeTypes],
    authors: [{ name: 'Sebastiaan "Kyzegs" Zegers' }],
    creator: 'Sebastiaan "Kyzegs" Zegers',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: shareUrl,
      title: `Shared Doctrine Entity: ${entityName}`,
      description,
      siteName: 'Doctrine Entity Generator',
    },
    twitter: {
      card: 'summary',
      title: `Shared Doctrine Entity: ${entityName}`,
      description,
      creator: '@doctrine',
    },
    alternates: {
      canonical: shareUrl,
    },
    robots: {
      index: false, // Don't index shared links as they expire
      follow: false,
    },
  };
}

export default function SharedCodePage() {
  return <SharedCodeClient />;
}
