'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Button } from '@/components/ui/button';
import { FileCode, FileJson, Database, Share2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  islandsDarkColors,
  islandsDarkLineNumberStyle,
  islandsDarkPrism,
  islandsDarkTypography,
} from '@/lib/islands-dark-editor-theme';

export interface CodeFile {
  id: string;
  title: string;
  code: string;
  language: string;
  /** Optional display name in sidebar/toolbar (e.g. "User.orm.xml") */
  fileName?: string;
}

interface FileCodeViewerProps {
  files: CodeFile[];
  activeFileId?: string;
  onActiveFileChange?: (fileId: string) => void;
  onShare?: () => void;
  hideShareButton?: boolean;
  /** Optional extra buttons in the toolbar (e.g. Download All) */
  toolbarExtra?: React.ReactNode;
}

function getLanguage(lang: string): string {
  switch (lang.toLowerCase()) {
    case 'xml':
      return 'xml';
    case 'php':
      return 'php';
    case 'sql':
      return 'sql';
    default:
      return 'text';
  }
}

function getFileName(file: CodeFile): string {
  if (file.fileName) return file.fileName;
  switch (file.id) {
    case 'xml':
      return 'mapping.orm.xml';
    case 'php':
      return 'Entity.php';
    case 'sql':
      return 'schema.sql';
    default:
      return (
        file.title.replace(/\s+/g, '-').toLowerCase() +
        (file.language === 'xml' ? '.xml' : file.language === 'php' ? '.php' : '.sql')
      );
  }
}

function FileIcon({ file }: { file: CodeFile }) {
  const lang = file.language?.toLowerCase();
  if (lang === 'xml') return <FileCode className="h-4 w-4 shrink-0 text-amber-500" />;
  if (lang === 'php') return <FileCode className="h-4 w-4 shrink-0 text-indigo-500" />;
  if (lang === 'sql') return <Database className="h-4 w-4 shrink-0 text-emerald-500" />;
  return <FileJson className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function FileCodeViewer({
  files,
  activeFileId,
  onActiveFileChange,
  onShare,
  hideShareButton = false,
  toolbarExtra,
}: FileCodeViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const activeId = activeFileId ?? files[0]?.id;
  const activeFile = files.find((f) => f.id === activeId) ?? files[0];

  const copyToClipboard = async (code: string, fileId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(fileId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (files.length === 0) return null;

  return (
    <div
      className={cn(
        'flex w-full rounded-lg border border-border bg-card overflow-hidden min-h-[320px]',
        isExpanded && 'fixed inset-0 z-50 rounded-none border-0 min-h-0 h-screen'
      )}
    >
      {/* File list sidebar */}
      <div className="w-48 shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Files</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                Minimize editor
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                Expand editor
              </>
            )}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-1">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => onActiveFileChange?.(file.id)}
              className={cn(
                'w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                activeId === file.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <FileIcon file={file} />
              <span className="truncate">{getFileName(file)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Code panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/20 shrink-0">
          <span className="text-sm font-medium text-foreground truncate">
            {activeFile ? getFileName(activeFile) : ''}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {!hideShareButton && activeFile && (
              <Button onClick={() => onShare?.()} variant="outline" size="sm" className="gap-1.5 h-8">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            )}
            {activeFile && (
              <Button onClick={() => copyToClipboard(activeFile.code, activeFile.id)} size="sm" className="h-8 gap-1.5">
                {copiedId === activeFile.id ? 'Copied!' : 'Copy'}
              </Button>
            )}
            {toolbarExtra}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {activeFile && (
            <SyntaxHighlighter
              language={getLanguage(activeFile.language)}
              style={islandsDarkPrism}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                backgroundColor: islandsDarkColors.editorBackground,
                color: islandsDarkColors.editorForeground,
                fontFamily: islandsDarkTypography.fontFamily,
                fontSize: islandsDarkTypography.fontSize,
                lineHeight: islandsDarkTypography.lineHeight,
                padding: '1rem 1.25rem',
                minHeight: '100%',
              }}
              lineNumberStyle={islandsDarkLineNumberStyle}
              showLineNumbers
              wrapLines
            >
              {activeFile.code}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </div>
  );
}
