'use client';

import { GripHorizontal } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the DragHandle component
 */
interface DragHandleProps {
  /** ID of the node this handle belongs to */
  nodeId: string;
}

/**
 * DragHandle Component
 * 
 * Provides a consistent drag handle for different node types.
 * Used to allow users to drag and reposition nodes on the canvas.
 * 
 * @param props - Component props
 * @returns React component that renders a drag handle
 */
export default function DragHandle({ nodeId }: DragHandleProps): React.ReactElement {
  return (
    <div 
      className={cn(
        "absolute w-20 h-6 top-0 left-1/2 -translate-x-1/2 -translate-y-10",
        "flex items-center justify-center cursor-grab",
        "bg-foreground border border-border rounded-md shadow-md"
      )}
      data-grab-handle="true"
      data-node-id={nodeId}
      title="Drag to move"
      style={{ 
        pointerEvents: 'auto',
        zIndex: 20 // Higher z-index to ensure it's always on top
      }}
    >
      {/* Make the icon fill the entire width of the handle for better grabbing */}
      <div className="w-full h-full flex items-center justify-center" data-grab-handle="true">
        <GripHorizontal 
          className="h-4 w-4 text-card pointer-events-none" 
          data-grab-handle="true"
        />
      </div>
    </div>
  );
} 