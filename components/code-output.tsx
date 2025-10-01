'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeOutputProps {
  title: string;
  code: string;
  language: string;
}

export function CodeOutput({ title, code, language }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 flex justify-between items-center">
        <h3 className="font-medium text-foreground">{title}</h3>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={getLanguage(language)}
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
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
