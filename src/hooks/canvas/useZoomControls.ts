'use client';

import { useCallback } from 'react';
import { MotionValue, animate } from 'framer-motion';
import { MutableRefObject } from 'react';
import { Node } from '@/types';

/**
 * Props for useZoomControls hook
 */
interface UseZoomControlsProps {
  /** MotionValue for scale */
  scale: MotionValue<number>;
  /** MotionValue for x position */
  x: MotionValue<number>;
  /** MotionValue for y position */
  y: MotionValue<number>;
  /** Reference to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** All nodes in the graph */
  nodes: Record<string, Node>;
  /** Currently active node id */
  activeNodeId?: string;
  /** Optional function to handle zoom with coordinates */
  onZoom?: (zoomFactor: number, clientX: number, clientY: number) => void;
}

/**
 * Return type for the useZoomControls hook
 */
interface UseZoomControlsReturn {
  /** Handler for zoom in/out button clicks */
  handleZoomButton: (zoomIn: boolean) => void;
  /** Function to reset view and center on a specific node */
  resetView: (targetNodeId?: string) => void;
}

/**
 * Hook for zoom control functionality
 * 
 * Provides methods for controlling canvas zoom:
 * - Reset view to center on a specific node
 * - Zoom in/out buttons for precise control
 * - Automatic centering on active node
 * 
 * @param props - Hook configuration props
 * @returns Methods for controlling zoom and position
 */
export function useZoomControls({
  scale,
  x,
  y,
  containerRef,
  nodes,
  activeNodeId,
  onZoom
}: UseZoomControlsProps): UseZoomControlsReturn {
  /**
   * Resets the view to center on a node with smooth animation
   * 
   * @param targetNodeId - Optional node ID to center on (defaults to activeNodeId)
   */
  const resetView = useCallback(() => {
    // Use provided targetNodeId or fall back to activeNodeId
    const nodeId = activeNodeId || '';
    const node = nodeId ? nodes[nodeId] : null;
    
    if (node) {
      // Get window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Center node position
      const newX = windowWidth / 2 - node.position.x;
      const newY = windowHeight / 2 - node.position.y;
      
      // Animate to new position and reset scale
      animate(x, newX, { type: 'spring', stiffness: 400, damping: 30 });
      animate(y, newY, { type: 'spring', stiffness: 400, damping: 30 });
      animate(scale, 1, { type: 'spring', stiffness: 400, damping: 30 });
    } else {
      // Reset to defaults if no node specified
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
      animate(scale, 1, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [nodes, activeNodeId, x, y, scale]);
  
  /**
   * Handles zoom button clicks for manual zoom in/out
   * 
   * @param zoomIn - True to zoom in, false to zoom out
   */
  const handleZoomButton = useCallback(
    (zoomIn: boolean) => {
      if (!containerRef.current) return;
      
      // Get container dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Get current scale
      const currentScale = scale.get();
      
      // Calculate new scale with fixed step (10%)
      // Respect the limits of 0.5 (min) and 1.0 (max)
      const zoomStep = 0.1; // 10% zoom step
      const newScale = zoomIn 
        ? Math.min(1.0, currentScale + zoomStep) 
        : Math.max(0.5, currentScale - zoomStep);
      
      // Calculate zoom factor
      const zoomFactor = newScale / currentScale;
      
      // Apply zoom centered on the canvas
      onZoom?.(zoomFactor, centerX, centerY);
    },
    [containerRef, scale, onZoom]
  );
  
  return {
    handleZoomButton,
    resetView
  };
} 