'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSharedData, ShareableCode, getErrorMessage } from '@/lib/utils';
import { downloadEntitiesAsZip } from '@/lib/bulk-entity-zip';
import { EntityCodeOutput } from '@/components/entity-code-output';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code2 } from 'lucide-react';
import { toast } from 'sonner';

export function SharedCodeClient() {
  const params = useParams();
  const router = useRouter();
  const [sharedData, setSharedData] = useState<ShareableCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSharedData = async () => {
      try {
        const code = params.code as string;
        if (!code) {
          setError('No share code provided');
          return;
        }

        const data = await getSharedData(code);
        setSharedData(data);
      } catch (err) {
        console.error('Failed to load shared data:', err);
        const errorMessage = getErrorMessage(err, 'Invalid or corrupted share link');
        setError(errorMessage);
        toast.error('Failed to load shared code', {
          description:
            errorMessage === 'Link has expired'
              ? 'This share link has expired (15 minutes limit).'
              : 'The share link appears to be invalid or corrupted.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSharedData();
  }, [params.code]);

  const handleBackToGenerator = () => {
    router.push('/');
  };

  const handleDownloadAll = async () => {
    if (!sharedData?.entities?.length) return;
    try {
      const count = await downloadEntitiesAsZip(sharedData.entities, 'entities.zip');
      if (count > 0) toast.success(`Downloaded ${count} entities as ZIP`);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      toast.error('Failed to create download');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared code...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="bg-destructive/10 text-destructive rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Code2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Unable to Load Shared Code</h1>
          <p className="text-muted-foreground mb-6">{error || 'The share link appears to be invalid or corrupted.'}</p>
          <Button onClick={handleBackToGenerator} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go to Generator
          </Button>
        </div>
      </div>
    );
  }

  const entities = sharedData.entities.filter((e) => !e.hasError);
  const displayEntities = sharedData.entities.length > 1 ? entities : sharedData.entities;

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 w-full">
        <Button onClick={handleBackToGenerator} variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Generator
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Code2 className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Shared Doctrine Code</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="w-full p-4">
        <div className="mb-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-medium text-sm text-muted-foreground mb-2">Shared Information</h2>
            <div className="text-sm space-y-1">
              {sharedData.timestamp && (
                <p className="text-muted-foreground">Shared on: {new Date(sharedData.timestamp).toLocaleString()}</p>
              )}
              <p className="text-muted-foreground">
                Contains:{' '}
                {[
                  sharedData.entities.length > 1 ? `${sharedData.entities.length} Entities` : null,
                  sharedData.entities.length === 1 && sharedData.entities[0]?.xmlOutput && 'XML Mapping',
                  sharedData.entities.length === 1 && sharedData.entities[0]?.phpOutput && 'PHP Entity',
                  sharedData.sqlInput && 'Original SQL',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        </div>

        <EntityCodeOutput
          entities={displayEntities}
          sqlInput={sharedData.sqlInput}
          onDownloadAll={sharedData.entities.length > 1 ? handleDownloadAll : undefined}
          hideShareButton
          emptyMessage="No code available in this share link"
        />
      </main>
    </div>
  );
}
