import type { Metadata } from 'next';
import { getSharedDataServer, toPascalCase, ShareableCode } from '@/lib/utils';
import { SQLParser } from '@/lib/sql-parser';
import { DatabaseDialect } from '@/lib/example-queries';
import { SharedCodeClient } from './shared-code-client';

/**
 * Extract entity name from shared data
 */
function extractEntityInfo(sharedData: ShareableCode): { entityName: string; tableName: string; codeTypes: string[] } {
  let entityName = 'Entity';
  let tableName = 'table';
  const codeTypes: string[] = [];

  // Try to extract from PHP entity class
  if (sharedData.phpOutput) {
    codeTypes.push('PHP Entity');
    const classMatch = sharedData.phpOutput.match(/class\s+(\w+)/);
    if (classMatch) {
      entityName = classMatch[1];
    }
  }

  // Try to extract from XML mapping
  if (sharedData.xmlOutput) {
    codeTypes.push('XML Mapping');
    const entityMatch = sharedData.xmlOutput.match(/<entity\s+name="([^"]+)"/);
    if (entityMatch && entityName === 'Entity') {
      entityName = entityMatch[1];
    }
  }

  // Try to extract table name from SQL
  if (sharedData.sqlInput) {
    codeTypes.push('SQL');
    try {
      const dialect = sharedData.options?.databaseDialect || DatabaseDialect.MYSQL;
      const schema = SQLParser.parseCreateTable(sharedData.sqlInput, dialect);
      tableName = schema.name;
      if (entityName === 'Entity') {
        // Use entity name from options or convert table name
        if (sharedData.options?.entityName) {
          entityName = sharedData.options.entityName;
        } else {
          const prefix = sharedData.options?.entityPrefix || '';
          const suffix = sharedData.options?.entitySuffix || '';
          entityName = `${prefix}${toPascalCase(tableName)}${suffix}`;
        }
      }
    } catch (e) {
      // If SQL parsing fails, try simple regex
      const tableMatch = sharedData.sqlInput.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?(\w+)`?|(\w+))/i);
      if (tableMatch) {
        tableName = tableMatch[1] || tableMatch[2] || 'table';
      }
    }
  }

  return { entityName, tableName, codeTypes };
}

/**
 * Generate metadata for shared code pages
 */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const sharedData = await getSharedDataServer(code);

  if (!sharedData) {
    return {
      title: 'Shared Code Not Found',
      description: 'The shared Doctrine entity code could not be found or has expired.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { entityName, tableName, codeTypes } = extractEntityInfo(sharedData);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://entity-generator.vercel.app';
  const shareUrl = `${siteUrl}/share/${code}`;

  const description = `View shared Doctrine entity code for ${entityName}${tableName !== 'table' ? ` (table: ${tableName})` : ''}. Includes: ${codeTypes.join(', ')}.`;

  return {
    title: `Shared: ${entityName}`,
    description,
    keywords: [
      'doctrine',
      'doctrine orm',
      'php entity',
      'shared code',
      entityName,
      tableName,
      ...codeTypes,
    ],
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
