'use client';

import { useState } from 'react';

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
      <div className="p-4 bg-gray-900 text-gray-100 overflow-x-auto">
        <pre className="text-sm">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
}
