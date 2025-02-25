'use client';

import { useCallback } from 'react';
import { MotionValue, animate } from 'framer-motion';
import { MutableRefObject } from 'react';
import { Node } from '@/types';

/**
 * Props for the useZoomControls hook
 */
interface UseZoomControlsProps {
  /** Motion value for scale/zoom level */
  scale: MotionValue<number>;
  /** Motion value for X position */
  x: MotionValue<number>;
  /** Motion value for Y position */
  y: MotionValue<number>;
  /** Reference to the container element */
  containerRef: MutableRefObject<HTMLDivElement | null>;
  /** Map of all nodes in the canvas */
  nodes: Record<string, Node>;
  /** ID of the currently active node */
  activeNodeId: string;
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
 * Hook for managing zoom controls and view positioning
 * 
 * Provides functions to handle zoom button clicks and resetting the view
 * to center on specific nodes with smooth animations.
 * 
 * @param props - Hook configuration props
 * @returns Object containing zoom control functions
 */
export function useZoomControls({
  scale,
  x,
  y,
  containerRef,
  nodes,
  activeNodeId
}: UseZoomControlsProps): UseZoomControlsReturn {
  /**
   * Resets the view to center on a specific node or the active node
   * 
   * @param targetNodeId - Optional ID of node to center on, defaults to active node
   */
  const resetView = useCallback((targetNodeId?: string): void => {
    // Use provided targetNodeId or fall back to activeNodeId
    const nodeId = targetNodeId || activeNodeId;
    const node = nodes[nodeId];
    
    if (node) {
      // Use framer-motion's animate for smooth transitions
      animate(x, window.innerWidth / 2 - node.position.x, { duration: 0.5 });
      animate(y, window.innerHeight / 2 - node.position.y, { duration: 0.5 });
      animate(scale, 1, { duration: 0.5 });
    } else {
      // If no node is found or active, just reset to center and default scale
      animate(x, 0, { duration: 0.5 });
      animate(y, 0, { duration: 0.5 });
      animate(scale, 1, { duration: 0.5 });
    }
  }, [nodes, activeNodeId, x, y, scale]);
  
  // Button zoom handlers (more precise control)
  const handleZoomButton = useCallback((zoomIn: boolean) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const currentScale = scale.get();
      const currentX = x.get();
      const currentY = y.get();
      
      // Fixed increments for button zooming
      const nextScale = zoomIn 
        ? Math.min(3, currentScale * 1.2) 
        : Math.max(0.2, currentScale / 1.2);
      
      if (nextScale !== currentScale) {
        // Calculate point position in world space
        const pointX = (centerX - currentX) / currentScale;
        const pointY = (centerY - currentY) / currentScale;
        
        // Calculate new position to zoom toward center
        const newX = centerX - pointX * nextScale;
        const newY = centerY - pointY * nextScale;
        
        // Animate to new values for smoother transition
        animate(scale, nextScale, { duration: 0.2 });
        animate(x, newX, { duration: 0.2 });
        animate(y, newY, { duration: 0.2 });
      }
    }
  }, [scale, x, y, containerRef]);
  
  return {
    handleZoomButton,
    resetView
  };
} 