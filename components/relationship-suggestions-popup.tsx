'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelationshipSuggestion {
  field: string;
  targetEntity: string;
  column: string;
  type: string;
  isNullable?: boolean;
}

interface RelationshipSuggestionsPopupProps {
  suggestions: RelationshipSuggestion[];
  onAddSuggestion: (suggestion: RelationshipSuggestion) => void;
  onDismiss: () => void;
}

export function RelationshipSuggestionsPopup({ 
  suggestions, 
  onAddSuggestion, 
  onDismiss 
}: RelationshipSuggestionsPopupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3 gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">
              Relationship Suggestions
            </h3>
            <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              {suggestions.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3">
            <p className="text-sm text-muted-foreground mb-3">
              Fields ending with "_id" detected:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={`suggestion-${suggestion.field}-${suggestion.column}-${index}`} 
                  className="flex items-center justify-between p-2 bg-muted rounded border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {suggestion.field} → {suggestion.targetEntity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.column} | {suggestion.type}
                      {suggestion.isNullable && ' | Nullable'}
                    </div>
                  </div>
                  <Button
                    onClick={() => onAddSuggestion(suggestion)}
                    size="sm"
                    className="ml-2 flex-shrink-0"
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
