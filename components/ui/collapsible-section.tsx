'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  onRemove?: () => void;
  children: ReactNode;
  showDragHandle?: boolean;
  showOrderNumber?: boolean;
  orderNumber?: number;
  headerToggle?: ReactNode; // Optional toggle control in header
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragged?: boolean;
}

export function CollapsibleSection({
  id,
  title,
  subtitle,
  onRemove,
  children,
  showDragHandle = false,
  showOrderNumber = false,
  orderNumber,
  headerToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragged = false
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <div 
      className={`border border-border rounded-lg ${isDragged ? 'opacity-50' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between p-4 bg-muted">
        <div className="flex items-center space-x-3">
          {/* Drag Handle */}
          {showDragHandle && (
            <div 
              className="cursor-move text-muted-foreground hover:text-foreground"
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <GripVertical className="w-5 h-5" />
            </div>
          )}
          
          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          
          {/* Title */}
          <div>
            <h5 className="font-medium text-foreground">
              {title}
            </h5>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Header Toggle (if provided) */}
        {headerToggle && (
          <div className="flex items-center">
            {headerToggle}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {showOrderNumber && (
            <span className="text-sm text-muted-foreground">#{orderNumber}</span>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="px-2 py-1 text-destructive hover:text-destructive/80 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      
      {/* Content - Collapsible */}
      {!isCollapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
