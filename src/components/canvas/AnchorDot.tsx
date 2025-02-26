'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

/**
 * Props for the AnchorDot component
 */
interface AnchorDotProps {
  /** ID of the node this anchor belongs to */
  nodeId: string;
  /** Position of the anchor relative to the node */
  position?: 'right' | 'left' | 'top' | 'bottom';
  /** Optional click handler for the anchor - no longer used */
  onClick?: (e: React.MouseEvent) => void;
  /** Optional class name for additional styling */
  className?: string;
  /** Whether the anchor is active/highlighted */
  isActive?: boolean;
}

/**
 * AnchorDot Component
 * 
 * Provides a consistent anchor point for connecting nodes.
 * Can be positioned on different sides of a node.
 * 
 * @param props - Component props
 * @returns React component that renders an anchor dot
 */
export default function AnchorDot({ 
  nodeId, 
  position = 'right',
  onClick, // Kept for backward compatibility but not used
  className,
  isActive = false
}: AnchorDotProps): React.ReactElement {
  // Position styles based on the position prop
  // Adjusted positions to ensure anchors are not cut off by glow effects
  const positionStyles: Record<string, React.CSSProperties> = {
    right: { 
      right: '-14px', // Moved back to previous position
      top: '50%', 
      transform: 'translateY(-50%)' 
    },
    left: { 
      left: '-14px', // Moved back to previous position
      top: '50%', 
      transform: 'translateY(-50%)' 
    },
    top: { 
      top: '-14px', // Moved back to previous position
      left: '50%', 
      transform: 'translateX(-50%)' 
    },
    bottom: { 
      bottom: '-14px', // Moved back to previous position
      left: '50%', 
      transform: 'translateX(-50%)' 
    }
  };

  return (
    <div 
      className={cn(
        "absolute w-6 h-6 flex items-center justify-center",
        "transition-all duration-200", // Removed cursor-pointer class
        isActive && "scale-110",
        className
      )}
      data-anchor-dot="true"
      data-node-id={nodeId}
      data-position={position}
      style={{ 
        ...positionStyles[position],
        zIndex: 100, // Even higher z-index to ensure it's above everything
        position: 'absolute', // Ensure absolute positioning
        overflow: 'visible', // Ensure overflow is visible
        pointerEvents: 'none', // Disable pointer events to prevent clicks
        cursor: 'default' // Explicitly set cursor to default to prevent hand cursor
      }}
      // Removed onClick handler
    >
      <div 
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center",
          "bg-card border border-border shadow-sm",
          // Removed hover effects since clicks are disabled
          isActive && "bg-accent border-primary"
        )}
        style={{ cursor: 'default' }} // Also set cursor on inner element
      >
        <Plus className="h-2.5 w-2.5 text-muted-foreground" />
      </div>
    </div>
  );
} 