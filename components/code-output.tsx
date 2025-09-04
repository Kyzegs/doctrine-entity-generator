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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
