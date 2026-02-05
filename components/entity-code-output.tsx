'use client';

import * as React from 'react';
import { GeneratedEntity } from '@/lib/types';
import { FileCodeViewer, type CodeFile } from '@/components/file-code-viewer';
import { Button } from '@/components/ui/button';
import { Code2, Download } from 'lucide-react';

export interface EntityCodeOutputProps {
  /** One or more generated entities. Always displayed as a flat file list in one viewer. */
  entities: GeneratedEntity[];
  /** Optionally show SQL as an extra tab (e.g. share page). */
  sqlInput?: string;
  /** When multiple entities: trigger ZIP download. Shown as toolbar button. */
  onDownloadAll?: () => void;
  /** Share callback (share current code / all entities). */
  onShare?: () => void;
  /** Hide the Share button (e.g. on share page). */
  hideShareButton?: boolean;
  /** Shown when there are no files to display. */
  emptyMessage?: string;
}

/** Build a flat list of code files from entities. Same format for one or many tables. */
function buildFilesFromEntities(entities: GeneratedEntity[], sqlInput?: string): CodeFile[] {
  const success = entities.filter((e) => !e.hasError);
  const files: CodeFile[] = success.flatMap((entity) => [
    ...(entity.xmlOutput
      ? [
          {
            id: `${entity.entityName}-xml`,
            title: 'Doctrine XML Mapping',
            code: entity.xmlOutput,
            language: 'xml',
            fileName: `${entity.entityName}.orm.xml`,
          },
        ]
      : []),
    ...(entity.phpOutput
      ? [
          {
            id: `${entity.entityName}-php`,
            title: 'PHP Entity Class',
            code: entity.phpOutput,
            language: 'php',
            fileName: `${entity.entityName}.php`,
          },
        ]
      : []),
  ]);
  if (sqlInput) {
    files.push({
      id: 'sql',
      title: 'Original SQL',
      code: sqlInput,
      language: 'sql',
      fileName: 'schema.sql',
    });
  }
  return files;
}

export function EntityCodeOutput({
  entities,
  sqlInput,
  onDownloadAll,
  onShare,
  hideShareButton = false,
  emptyMessage = 'No code available',
}: EntityCodeOutputProps) {
  const [activeFileId, setActiveFileId] = React.useState<string>('');

  const files = React.useMemo(() => buildFilesFromEntities(entities, sqlInput), [entities, sqlInput]);

  if (entities.length === 0) return null;

  if (files.length === 0) {
    return (
      <div className="text-center p-12 bg-card border border-border rounded-lg">
        <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const toolbarExtra =
    entities.length > 1 && onDownloadAll ? (
      <Button onClick={onDownloadAll} variant="outline" size="sm" className="h-8 gap-1.5">
        <Download className="h-3.5 w-3.5" />
        Download All ({entities.length})
      </Button>
    ) : undefined;

  return (
    <FileCodeViewer
      files={files}
      activeFileId={activeFileId || files[0]?.id}
      onActiveFileChange={setActiveFileId}
      onShare={onShare}
      hideShareButton={hideShareButton}
      toolbarExtra={toolbarExtra}
    />
  );
}
