'use client';

import { GripHorizontal } from 'lucide-react';
import React from 'react';

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
      className="absolute w-20 h-6 top-0 left-1/2 -translate-x-1/2 -translate-y-10 flex items-center justify-center cursor-grab bg-zinc-700 rounded-md z-10 shadow-md"
      data-grab-handle="true"
      data-node-id={nodeId}
      title="Drag to move"
    >
      {/* Make the icon fill the entire width of the handle for better grabbing */}
      <div className="w-full h-full flex items-center justify-center" data-grab-handle="true">
        <GripHorizontal 
          className="h-4 w-4 text-zinc-200 pointer-events-none" 
          data-grab-handle="true"
        />
      </div>
    </div>
  );
} 