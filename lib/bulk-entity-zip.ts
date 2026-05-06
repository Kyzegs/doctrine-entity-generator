import JSZip from 'jszip';
import { GeneratedEntity, GeneratedPhpEnumOutput } from './types';

export interface EntityForZip {
  entityName: string;
  xmlOutput?: string;
  phpOutput: string;
  phpEnumOutputs?: GeneratedPhpEnumOutput[];
}

/**
 * Build a ZIP blob containing PHP and XML files for the given entities.
 * Use in client components only (e.g. Download All button).
 */
export async function createBulkEntitiesZip(entities: EntityForZip[]): Promise<Blob> {
  const zip = new JSZip();

  for (const entity of entities) {
    if (entity.xmlOutput) {
      zip.file(`${entity.entityName}.orm.xml`, entity.xmlOutput);
    }
    zip.file(`${entity.entityName}.php`, entity.phpOutput);
    for (const enumOutput of entity.phpEnumOutputs || []) {
      zip.file(enumOutput.fileName, enumOutput.phpOutput);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger browser download of a blob (e.g. ZIP) with the given filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Filter to success entities, create ZIP, trigger download. Returns count of entities in the ZIP.
 * Use in client components (e.g. Download All on main page and share page).
 */
export async function downloadEntitiesAsZip(entities: GeneratedEntity[], filename = 'entities.zip'): Promise<number> {
  const success = entities.filter((e) => !e.hasError);
  if (success.length === 0) return 0;
  const zip = await createBulkEntitiesZip(success);
  downloadBlob(zip, filename);
  return success.length;
}
