import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GenerationOptions } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Share utilities
export interface ShareableCode {
  xmlOutput?: string;
  phpOutput?: string;
  sqlInput?: string;
  options?: Partial<GenerationOptions>;
  timestamp?: string;
}

export interface ShareResponse {
  code: string;
  expiresAt: string;
}

export interface ShareDataResponse {
  data: ShareableCode;
  expiresAt: string;
}

/**
 * Creates a shareable link by storing data in the database
 */
export async function createShareUrl(data: ShareableCode): Promise<string> {
  const shareData = {
    ...data,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    const result: ShareResponse = await response.json();
    
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : '';
    
    return `${baseUrl}/share/${result.code}`;
  } catch (error) {
    console.error('Failed to create share link:', error);
    throw new Error('Failed to create share link');
  }
}

/**
 * Retrieves shared data from the database
 */
export async function getSharedData(code: string): Promise<ShareableCode> {
  try {
    const response = await fetch(`/api/share/${code}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Link not found');
      }
      if (response.status === 410) {
        throw new Error('Link has expired');
      }
      throw new Error('Failed to retrieve shared data');
    }

    const result: ShareDataResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to retrieve shared data:', error);
    throw error;
  }
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }
  
  await navigator.clipboard.writeText(text);
}
