'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSharedData, ShareableCode } from '@/lib/utils';
import { TabbedCodeOutput } from '@/components/tabbed-code-output';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SharedCodePage() {
  const params = useParams();
  const router = useRouter();
  const [sharedData, setSharedData] = useState<ShareableCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

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
        const errorMessage = err instanceof Error ? err.message : 'Invalid or corrupted share link';
        setError(errorMessage);
        
        toast.error('Failed to load shared code', {
          description: errorMessage === 'Link has expired' 
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
          <p className="text-muted-foreground mb-6">
            {error || 'The share link appears to be invalid or corrupted.'}
          </p>
          <Button onClick={handleBackToGenerator} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go to Generator
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    ...(sharedData.xmlOutput ? [{
      id: 'xml',
      title: 'Doctrine XML Mapping',
      code: sharedData.xmlOutput,
      language: 'xml'
    }] : []),
    ...(sharedData.phpOutput ? [{
      id: 'php',
      title: 'PHP Entity Class',
      code: sharedData.phpOutput,
      language: 'php'
    }] : []),
    ...(sharedData.sqlInput ? [{
      id: 'sql',
      title: 'Original SQL',
      code: sharedData.sqlInput,
      language: 'sql'
    }] : [])
  ];

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 w-full">
        <Button
          onClick={handleBackToGenerator}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
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
                <p className="text-muted-foreground">
                  Shared on: {new Date(sharedData.timestamp).toLocaleString()}
                </p>
              )}
              <p className="text-muted-foreground">
                Contains: {[
                  sharedData.xmlOutput && 'XML Mapping',
                  sharedData.phpOutput && 'PHP Entity',
                  sharedData.sqlInput && 'Original SQL'
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {tabs.length > 0 ? (
          <TabbedCodeOutput 
            tabs={tabs} 
            hideShareButton={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <div className="text-center p-12 bg-card border border-border rounded-lg">
            <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No code available in this share link</p>
          </div>
        )}
      </main>
    </div>
  );
}

