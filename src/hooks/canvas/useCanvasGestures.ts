import { MutableRefObject, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { MotionValue, useSpring } from 'framer-motion';
import { animate } from 'framer-motion';
import { PanInfo } from 'framer-motion';

/**
 * Props for the useCanvasGestures hook
 */
interface UseCanvasGesturesProps {
  /** Motion value for X position */
  x: MotionValue<number>;
  /** Motion value for Y position */
  y: MotionValue<number>;
  /** Motion value for scale/zoom level */
  scale: MotionValue<number>;
  /** Reference to the container element */
  containerRef: MutableRefObject<HTMLDivElement | null>;
  /** Function to update dragging state */
  setIsDragging: (isDragging: boolean) => void;
  /** ID of the node being dragged, if any */
  draggingNodeId: string | null;
  /** Handler for pan/drag gestures */
  onPan: (dx: number, dy: number) => void;
  /** Handler for zoom/pinch gestures */
  onZoom: (scale: number, clientX?: number, clientY?: number) => void;
}

/**
 * Hook for handling canvas gesture interactions
 * 
 * Provides comprehensive gesture handling for the canvas including:
 * - Smooth inertial panning with spring physics
 * - Precise zooming with focus point preservation
 * - Touch and mouse gesture support
 * - Performance optimizations for smoother interactions
 * - Proper handling of node vs canvas dragging
 * 
 * @param props - Hook configuration props
 * @returns Gesture handlers to bind to the canvas element
 */
export function useCanvasGestures({
  x,
  y,
  scale,
  containerRef, 
  setIsDragging,
  draggingNodeId,
  onPan,
  onZoom
}: UseCanvasGesturesProps) {
  // Apply hardware acceleration to the container element
  useEffect(() => {
    if (containerRef.current) {
      // Force GPU acceleration
      containerRef.current.style.transform = 'translateZ(0)';
      containerRef.current.style.backfaceVisibility = 'hidden';
      
      // Add handlers for trackpad gestures on macOS
      const handleGestureStart = (e: any) => {
        e.preventDefault();
      };
      
      const handleGestureChange = (e: any) => {
        e.preventDefault();
      };
      
      // These are non-standard webkit events for trackpad gestures
      containerRef.current.addEventListener('gesturestart', handleGestureStart as EventListener);
      containerRef.current.addEventListener('gesturechange', handleGestureChange as EventListener);
      
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('gesturestart', handleGestureStart as EventListener);
          containerRef.current.removeEventListener('gesturechange', handleGestureChange as EventListener);
        }
      };
    }
  }, [containerRef]);
  
  // Throttling reference for wheel events
  const lastWheelEventTime = useRef<number>(0);
  const THROTTLE_MS = 16; // Approximately 60fps

  // Use unified gesture handling for better compatibility
  const bindGestures = useGesture({
    // Handle drag for panning the canvas
    onDrag: ({ movement: [mx, my], velocity: [vx, vy], first, last, event, memo = { startX: 0, startY: 0 } }) => {
      // Skip if we're dragging a node
      if (draggingNodeId) return memo;
      
      // Skip if target is a node or inside a node
      if (event.target instanceof HTMLElement) {
        const isNodeElement = 
          event.target.closest('[data-grab-handle="true"]') ||
          event.target.closest('[data-node-id]');
        
        if (isNodeElement) return memo;
      }
      
      try {
        event.preventDefault();
      } catch (e) {
        // Ignore errors about passive events
      }
      
      if (first) {
        setIsDragging(true);
        memo.startX = x.get();
        memo.startY = y.get();
      }
      
      // Calculate new position
      const newX = memo.startX + mx;
      const newY = memo.startY + my;
      
      // Apply movement with immediate response
      x.set(newX);
      y.set(newY);
      
      if (last) {
        setIsDragging(false);
        
        // Apply inertia when releasing with significant velocity
        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
          animate(x, newX + vx * 15, {
            type: "spring",
            velocity: vx,
            stiffness: 40,
            damping: 20,
            restDelta: 0.001
          });
          
          animate(y, newY + vy * 15, {
            type: "spring",
            velocity: vy,
            stiffness: 40,
            damping: 20,
            restDelta: 0.001
          });
        }
      }
      
      return memo;
    },
    
    // Handle wheel events for zooming and panning
    onWheel: ({ event }) => {
      onWheel(event as WheelEvent);
    },
    
    // Handle pinch zoom for touch devices
    onPinch: ({ offset: [s], origin: [ox, oy], event }) => {
      // Check if this is a touch event with touches property
      const touch = 'touches' in event ? event.touches : null;
      const clientX = touch ? touch[0].clientX : ox;
      const clientY = touch ? touch[0].clientY : oy;
      onZoom(s, clientX, clientY);
    }
  }, {
    drag: {
      filterTaps: true,
      from: () => [0, 0],
      rubberband: true,
      delay: 0,
      threshold: 0,
    },
    wheel: {
      eventOptions: { capture: true, passive: false }
    },
    pinch: {
      eventOptions: { capture: true }
    }
  });
  
  // Handle wheel events separately
  const onWheel = useCallback(
    (event: WheelEvent) => {
      // Skip if we're dragging a node
      if (draggingNodeId) return;
      
      // Check if this is a pinch-to-zoom gesture
      const isPinchZoom = event.ctrlKey || event.metaKey;
      
      if (isPinchZoom) {
        // For pinch-to-zoom gestures, prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Throttle events for smoother zooming
        const now = Date.now();
        if (now - lastWheelEventTime.current < THROTTLE_MS) {
          return;
        }
        lastWheelEventTime.current = now;
        
        // Calculate zoom factor and apply zoom
        const delta = -event.deltaY;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        onZoom(zoomFactor, event.clientX, event.clientY);
      } else {
        // For regular scroll events, use them for panning
        onPan(-event.deltaX, -event.deltaY);
      }
    },
    [onPan, onZoom, draggingNodeId]
  );
  
  return bindGestures();
} 