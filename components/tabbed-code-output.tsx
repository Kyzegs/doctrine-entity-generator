'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CodeTab {
  id: string;
  title: string;
  code: string;
  language: string;
}

interface TabbedCodeOutputProps {
  tabs: CodeTab[];
}

export function TabbedCodeOutput({ tabs }: TabbedCodeOutputProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyToClipboard = async (code: string, tabId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTab(tabId);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Map language prop to syntax highlighter language
  const getLanguage = (lang: string) => {
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
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Tabs defaultValue={tabs[0]?.id} className="w-full">
        <div className="bg-muted px-4 py-2 border-b border-border">
          <TabsList className="h-auto p-1 bg-muted">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="m-0">
            <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
              <h3 className="font-medium text-foreground">{tab.title}</h3>
              <button
                onClick={() => copyToClipboard(tab.code, tab.id)}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                {copiedTab === tab.id ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={getLanguage(tab.language)}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {tab.code}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
