'use client';

import { Node } from '@/types';
import React, { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the ConnectionAnchor component
 */
interface ConnectionAnchorProps {
  /** ID of the node this connector belongs to */
  nodeId: string;
  /** Position of the connector: 'left' or 'right' */
  position: 'left' | 'right';
  /** Optional additional classes */
  className?: string;
}

/**
 * ConnectionAnchor Component
 * 
 * A simple component that renders a connection point for node connections.
 * These anchors serve as the visual markers for the start and end points of connections.
 * 
 * @param props - Component props
 * @param ref - Forwarded ref to access the DOM element
 * @returns React component that renders a connection anchor
 */
export const ConnectionAnchor = forwardRef<HTMLDivElement, ConnectionAnchorProps>(
  function ConnectionAnchor({ 
    nodeId, 
    position, 
    className 
  }: ConnectionAnchorProps, ref): React.ReactElement {
    return (
      <div 
        ref={ref}
        className={cn(
          "absolute top-1/2 w-4 h-4 bg-muted-foreground rounded-full transform border-2 border-background connection-anchor",
          position === 'left' ? 'left-0' : 'right-0',
          position === 'left' ? '-translate-x-6 -translate-y-1/2' : 'translate-x-6 -translate-y-1/2',
          className
        )}
        id={`connector-${nodeId}-${position}`}
        data-connector="true"
        data-node-id={nodeId}
        data-connector-position={position}
        style={{
          pointerEvents: 'all', // Make it interactive
          zIndex: 15 // Higher z-index to ensure visibility
        }}
      />
    );
  }
);

/**
 * Props for the ConnectionLine component
 */
interface ConnectionLineProps {
  /** The source node where the connection starts */
  sourceNode: Node;
  /** The target node where the connection ends */
  targetNode: Node;
  /** The current scale factor of the canvas */
  scale: number;
  /** Optional additional classes */
  className?: string;
}

/**
 * ConnectionLine Component
 * 
 * Renders a beautiful curved connection between node anchor dots
 * using direct calculations based on node positions.
 */
export function ConnectionLine({ 
  sourceNode, 
  targetNode,
  scale,
  className
}: ConnectionLineProps): React.ReactElement {
  // Define constants for anchor dimensions and node sizes
  // We can refine these values based on your actual CSS
  const NODE_WIDTH = 240; // Default node width
  const EXPLORE_NODE_WIDTH = 384; // w-96 = 24rem = 384px (updated from 320px)
  const BRANCH_NODE_WIDTH = 240; // w-60 = 15rem = 240px
  const ANCHOR_OFFSET = 24; // translate-x-6 = 1.5rem = 24px

  // Generate a unique ID for the gradient
  const gradientId = useMemo(() => 
    `connection-gradient-${sourceNode.id}-${targetNode.id}`, 
    [sourceNode.id, targetNode.id]
  );
  
  // Determine appropriate node widths based on node type
  const sourceWidth = sourceNode.type === 'explore' ? EXPLORE_NODE_WIDTH : BRANCH_NODE_WIDTH;
  const targetWidth = targetNode.type === 'explore' ? EXPLORE_NODE_WIDTH : BRANCH_NODE_WIDTH;
  
  // FIXED CONNECTION CALCULATION
  // With the new zoom system, the canvas scales uniformly from the top-left corner
  // We no longer need to multiply the offsets by scale - the positions are already in world coordinates
  
  // For right anchor (source) - typically from an ExploreNode
  const sourceX = sourceNode.position.x + (sourceWidth/2 + ANCHOR_OFFSET);
  const sourceY = sourceNode.position.y; // Y stays at center
  
  // For left anchor (target) - typically to a BranchNode
  const targetX = targetNode.position.x - (targetWidth/2 + ANCHOR_OFFSET);
  const targetY = targetNode.position.y; // Y stays at center
  
  // Calculate the distance between points
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate the midpoint
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  
  // Adjust curvature based on distance for more natural curves
  const curveFactor = Math.min(0.3, 40 / distance);
  
  // Calculate the control point for the quadratic Bezier curve
  // We offset perpendicular to the line for a natural curve
  const controlX = midX - dy * curveFactor;
  const controlY = midY + dx * curveFactor;
  
  // Create the SVG path - a quadratic Bezier curve (Q command)
  const path = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY}, ${targetX} ${targetY}`;
  
  // Render the SVG path
  return (
    <svg 
      className="absolute inset-0 pointer-events-none w-full h-full overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.6" />
        </linearGradient>
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow path (wider, more transparent) */}
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={4} // Keep constant width regardless of scale
        strokeLinecap="round"
        strokeOpacity={0.15}
        filter="url(#glow)"
      />
      
      {/* Main path with gradient */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2} // Keep constant width regardless of scale
        strokeLinecap="round"
        className={cn("connection-line", className)}
      />
    </svg>
  );
}

// For convenience, also export ConnectionLine as default
export default ConnectionLine; 