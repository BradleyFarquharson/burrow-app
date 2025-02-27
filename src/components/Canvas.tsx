'use client';

import React from 'react';
import { useExplorationStore } from '@/store/explorationStore';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, MotionValue, animate } from 'framer-motion';
import { Node } from '@/types';

// Import refactored hooks
import { useCanvasGestures, useNodeDragging, useZoomControls } from '@/hooks';

// Import refactored components
import ExploreNode from './canvas/ExploreNode';
import BranchNode from './canvas/BranchNode';
import ZoomControls from './canvas/ZoomControls';
import NodeConnections from './canvas/NodeConnections';
import { ZoomProvider } from '@/contexts';
import { cn } from '@/lib/utils';
import CanvasContent from './canvas/CanvasContent';

/**
 * Canvas Component
 * 
 * The main interactive canvas where nodes are displayed and manipulated.
 * Provides an infinite space for visualizing node networks with high-performance
 * interaction capabilities.
 * 
 * @features
 * - Infinite panning and zooming with hardware acceleration
 * - Individual node dragging without affecting canvas position
 * - Background remains fixed while dragging individual nodes
 * - Entire canvas can be panned while nodes remain fixed relative to each other
 * - Smooth zooming with proper focus point preservation
 * - Touch and mouse gesture support
 * - Performance optimizations for large node networks
 * 
 * @returns React component that renders the interactive canvas
 */
export default function Canvas(): React.ReactElement {
  const { nodes, activeNodeId, updateNodePosition, setActiveNode } = useExplorationStore();
  
  // Use motion values for better performance with hardware acceleration
  const scale = useMotionValue<number>(1);
  const x = useMotionValue<number>(0);
  const y = useMotionValue<number>(0);
  
  // Display values (for UI only, not for render calculations)
  const [displayScale, setDisplayScale] = useState<number>(1);
  
  // Track interaction states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Track client-side rendering to avoid hydration errors
  const [isClient, setIsClient] = useState<boolean>(false);
  
  // Use refs for animation and performance
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks for functionality
  const { draggingNodeId, handleNodeMouseDown } = useNodeDragging({
    scale,
    x,
    y,
    setActiveNode,
    updateNodePosition,
    activeNodeId
  });
  
  /**
   * Handles canvas zooming with focus point preservation
   * 
   * Calculates the appropriate scale and position to maintain the point under
   * the cursor/touch in the same relative position after zooming.
   * 
   * @param zoomFactor - Scale multiplier (>1 to zoom in, <1 to zoom out)
   * @param clientX - Optional X coordinate of zoom focus point
   * @param clientY - Optional Y coordinate of zoom focus point
   */
  const handleZoom = useCallback((zoomFactor: number, clientX?: number, clientY?: number): void => {
    if (!containerRef.current) return;
    
    // Get current values
    const currentScale = scale.get();
    const currentX = x.get();
    const currentY = y.get();
    
    // Calculate next scale with limits (0.5 to 1.0)
    const nextScale = Math.min(1.0, Math.max(0.5, currentScale * zoomFactor));
    
    if (nextScale !== currentScale && clientX !== undefined && clientY !== undefined) {
      // Get container dimensions and position
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate cursor position relative to container
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;
      
      // With transform-origin: '0 0', the formula is simpler:
      // 1. Convert cursor position from screen space to world space
      const worldX = (relativeX - currentX) / currentScale;
      const worldY = (relativeY - currentY) / currentScale;
      
      // 2. Calculate new position to keep the world point under cursor
      const newX = relativeX - worldX * nextScale;
      const newY = relativeY - worldY * nextScale;
      
      // Update values
      scale.set(nextScale);
      x.set(newX);
      y.set(newY);
    } else {
      // Zoom from center without client coordinates
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate the world position of the center point
      const worldX = (centerX - currentX) / currentScale;
      const worldY = (centerY - currentY) / currentScale;
      
      // Calculate new position to keep center fixed
      const newX = centerX - (worldX * nextScale);
      const newY = centerY - (worldY * nextScale);
      
      // Update values
      scale.set(nextScale);
      x.set(newX);
      y.set(newY);
    }
  }, [containerRef, scale, x, y]);
  
  // Extract resetView from useZoomControls and memoize it properly
  const { handleZoomButton } = useZoomControls({
    scale,
    x,
    y,
    containerRef,
    nodes,
    activeNodeId,
    onZoom: handleZoom
  });
  
  // Memoize resetView to avoid dependency issues
  const resetView = useCallback(() => {
    // Use provided targetNodeId or fall back to activeNodeId
    const nodeId = activeNodeId;
    const node = nodes[nodeId];
    
    if (node) {
      // Get window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Center node at window center
      x.set(windowWidth / 2 - node.position.x);
      y.set(windowHeight / 2 - node.position.y);
      
      // Reset scale to 1
      scale.set(1);
    } else {
      // If no node is found or active, just reset to center and default scale
      x.set(0);
      y.set(0);
      scale.set(1);
    }
  }, [activeNodeId, nodes, x, y, scale]);
  
  /**
   * Handles canvas panning by updating motion values
   * 
   * @param dx - Delta X movement in pixels
   * @param dy - Delta Y movement in pixels 
   */
  const handlePan = useCallback((dx: number, dy: number): void => {
    // Skip panning if a node is being dragged
    if (draggingNodeId) return;
    
    // Apply direct value update for smoother panning
    const newX = x.get() + dx;
    const newY = y.get() + dy;
    
    // Update position values
    x.set(newX);
    y.set(newY);
  }, [x, y, draggingNodeId]);
  
  /**
   * Handles wheel-triggered zoom gestures using our custom zoom functionality
   * 
   * Instead of just preventing zoom, this now captures trackpad pinch gestures
   * and routes them to our custom zoom handler for a better user experience.
   * 
   * @param e - Wheel event to process
   * @returns false if a zoom gesture was detected and handled
   */
  const handleWheelZoom = useCallback((e: WheelEvent): boolean | undefined => {
    // Skip zoom handling if we're dragging a node
    if (draggingNodeId) {
      return undefined;
    }
    
    // Prevent default browser behavior first to avoid double-zooming
    e.preventDefault();
    e.stopPropagation();
    
    // Capture exact cursor position for precise zoom targeting
    const { clientX, clientY } = e;
    
    // Determine zoom direction and calculate zoom factor
    let zoomFactor = 1.0;
    
    // Mac trackpads send wheel events with ctrlKey for pinch gestures
    if (e.ctrlKey || e.metaKey) {
      // More precise zoom for trackpad pinch
      const direction = e.deltaY < 0 ? 1 : -1; // -1 zoom out, 1 zoom in
      const magnitude = Math.min(Math.abs(e.deltaY) / 100, 0.2); // Reduced sensitivity
      zoomFactor = 1 + (direction * magnitude * 0.3); // Gentler zoom effect
    } else {
      // Standard mouse wheel zoom
      const direction = e.deltaY < 0 ? 1 : -1; // -1 zoom out, 1 zoom in
      zoomFactor = 1 + (direction * 0.05); // Reduced from 0.1 to 0.05 for gentler steps
    }
    
    // Always pass cursor position to zoom function
    // This is critical for zoom-to-cursor functionality
    handleZoom(zoomFactor, clientX, clientY);
    
    return false;
  }, [handleZoom, draggingNodeId]);
  
  // Set up gesture handling
  const bindGestures = useCanvasGestures({
    containerRef,
    x,
    y,
    scale,
    setIsDragging,
    draggingNodeId,
    onPan: handlePan,
    onZoom: handleZoom
  });
  
  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Reset view on initial load to center the active node
    if (activeNodeId && nodes[activeNodeId]) {
      setTimeout(() => resetView(), 100);
    }
    
    // Force hardware acceleration for the entire canvas
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateZ(0)';
      containerRef.current.style.backfaceVisibility = 'hidden';
    }
    
    // Enhanced zoom prevention system
    /**
     * Prevents default zoom behavior from browser events
     * 
     * @param e - The event to prevent default behavior for
     * @returns false to indicate the event was handled
     */
    const preventDefaultForZoom = (e: Event): boolean => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    /**
     * Prevents keyboard-triggered zoom shortcuts
     * 
     * Detects and blocks all common keyboard shortcuts used for zooming:
     * Ctrl/Cmd + [+, -, =, 0, _] and their numpad equivalents
     * 
     * @param e - Keyboard event to process
     * @returns false if a zoom shortcut was detected and prevented
     */
    const preventKeyboardZoom = (e: KeyboardEvent): boolean | undefined => {
      // Cover all known zoom keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && (
        e.key === '=' || 
        e.key === '-' || 
        e.key === '0' || 
        e.key === '+' ||
        e.key === '_' ||
        e.keyCode === 107 || // numpad +
        e.keyCode === 109 || // numpad -
        e.keyCode === 187 || // = key
        e.keyCode === 189    // - key
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      return undefined;
    };
    
    // Add event listeners with proper options to ensure they work
    window.addEventListener('wheel', handleWheelZoom, { passive: false, capture: true });
    window.addEventListener('keydown', preventKeyboardZoom, { passive: false });
    window.addEventListener('gesturestart', preventDefaultForZoom, { passive: false });
    window.addEventListener('gesturechange', preventDefaultForZoom, { passive: false });
    window.addEventListener('gestureend', preventDefaultForZoom, { passive: false });
    
    /**
     * Prevents touchend-triggered zoom gestures
     * 
     * @param e - Touch event to process
     */
    const preventTouchendZoom = (e: TouchEvent): void => {
      if (e.touches.length === 0) {
        e.preventDefault();
      }
    };
    
    // Prevent double-tap to zoom
    document.addEventListener('touchend', preventTouchendZoom, { passive: false });
    
    /**
     * Prevents pinch-to-zoom gestures on touchmove
     * 
     * Detects multi-touch gestures (like pinch) and prevents the default browser
     * behavior which would trigger zoom.
     * 
     * @param e - Touch event to process
     */
    const preventTouchZoom = (e: TouchEvent): void => {
      // More aggressively prevent touch zoom when multiple touches detected
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    // Add the touchmove listener with the right options
    window.addEventListener('touchmove', preventTouchZoom as EventListener, { passive: false, capture: true });
    
    /**
     * Prevents double-tap zoom by tracking tap timing
     * 
     * @param e - Touch event to process
     */
    const handleTouchStart = (e: TouchEvent): void => {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        // Double tap detected, prevent default behavior
        e.preventDefault();
      }
      lastTapTime = now;
    };
    
    // For double tap zoom prevention
    let lastTapTime = 0;
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      // Clean up all event listeners
      window.removeEventListener('wheel', handleWheelZoom, { capture: true });
      window.removeEventListener('keydown', preventKeyboardZoom);
      window.removeEventListener('gesturestart', preventDefaultForZoom);
      window.removeEventListener('gesturechange', preventDefaultForZoom);
      window.removeEventListener('gestureend', preventDefaultForZoom);
      window.removeEventListener('touchmove', preventTouchZoom as EventListener, { capture: true });
      document.removeEventListener('touchend', preventTouchendZoom);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [activeNodeId, nodes, handleWheelZoom, resetView, draggingNodeId]);
  
  // Update display scale for UI only
  useEffect(() => {
    const unsubscribeScale = scale.on('change', (value) => {
      setDisplayScale(value);
    });
    
    return () => {
      unsubscribeScale();
    };
  }, [scale]);
  
  // Add dedicated effect to handle activeNodeId changes with smooth animations
  useEffect(() => {
    // Skip initial render
    if (!isClient) return;
    
    // Skip if a node is being dragged - this prevents the centering animation
    // from interfering with drag operations
    if (draggingNodeId) return;
    
    // Animate to center on the active node whenever it changes
    if (activeNodeId && nodes[activeNodeId]) {
      // Small delay to ensure UI updates first
      const timeoutId = setTimeout(() => {
        // Double-check that we're still not dragging before starting animation
        // This prevents animation from starting if dragging begins during the timeout
        if (draggingNodeId) return;
        
        const node = nodes[activeNodeId];
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Use smooth animation without bounce
        animate(x, windowWidth / 2 - node.position.x, { 
          type: 'tween', 
          ease: 'easeOut',
          duration: 0.2
        });
        animate(y, windowHeight / 2 - node.position.y, { 
          type: 'tween', 
          ease: 'easeOut',
          duration: 0.2
        });
        // Keep current scale for consistency
      }, 50);
      
      // Clean up timeout if component unmounts or dependencies change
      return () => clearTimeout(timeoutId);
    }
  }, [activeNodeId, nodes, x, y, isClient, draggingNodeId]);

  // Wrap everything in the ZoomProvider
  return (
    <ZoomProvider scale={scale} x={x} y={y} nodes={nodes}>
      <div 
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden bg-background"
        style={{ 
          touchAction: 'none',
          // Ensure the container has a minimum height for visibility
          minHeight: '100vh'
        }}
        data-canvas="true"
        {...bindGestures}
        // Click on empty space to deselect nodes
        onClick={() => setActiveNode('')}
      >
        {/* Static dot grid background - fixed and not affected by any movement */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(128, 128, 128, 0.15) 2px, transparent 2px)`,
            backgroundSize: `40px 40px`,
            backgroundPosition: `0px 0px`,
            zIndex: 1
          }}
        />
        
        {isClient && (
          <>
            {/* Canvas content with scaling and translation */}
            <motion.div 
              ref={transformRef}
              className="absolute top-0 left-0 w-full h-full z-10"
              style={{ 
                x, 
                y,
                scale,
                transformOrigin: '0 0',
                willChange: 'transform'
              }}
            >
              <CanvasContent 
                nodes={nodes}
                activeNodeId={activeNodeId}
                draggingNodeId={draggingNodeId}
                handleNodeMouseDown={handleNodeMouseDown}
              />
            </motion.div>
            
            {/* Zoom Controls - fixed position */}
            <div className="absolute bottom-4 right-4 z-20">
              <ZoomControls 
                displayScale={displayScale}
                onZoomIn={() => handleZoomButton(true)}
                onZoomOut={() => handleZoomButton(false)}
                onReset={resetView}
              />
            </div>
          </>
        )}
      </div>
    </ZoomProvider>
  );
} 