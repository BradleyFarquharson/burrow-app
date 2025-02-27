'use client';

import { MutableRefObject, useEffect, useCallback, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { MotionValue } from 'framer-motion';
import { animate } from 'framer-motion';

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
  const isDraggingRef = useRef(false);
  const inertiaAnimationRef = useRef<{ x?: any; y?: any }>({});

  const stopInertia = useCallback(() => {
    if (inertiaAnimationRef.current.x) {
      inertiaAnimationRef.current.x.stop();
    }
    if (inertiaAnimationRef.current.y) {
      inertiaAnimationRef.current.y.stop();
    }
    inertiaAnimationRef.current = {};
  }, []);

  const bindGestures = useGesture({
    onDrag: ({ movement: [mx, my], velocity: [vx, vy], first, last, event, memo = { startX: 0, startY: 0 } }) => {
      if (draggingNodeId) return memo;

      if (event.target instanceof HTMLElement && 
          (event.target.closest('[data-grab-handle="true"]') || 
           event.target.closest('[data-node-id]'))) {
        return memo;
      }

      try {
        event.preventDefault();
      } catch (e) {}

      if (first) {
        stopInertia();
        isDraggingRef.current = true;
        memo.startX = x.get();
        memo.startY = y.get();
        setIsDragging(true);
      }

      const newX = memo.startX + mx;
      const newY = memo.startY + my;
      
      if (isDraggingRef.current) {
        x.set(newX);
        y.set(newY);
      }

      if (last) {
        isDraggingRef.current = false;
        setIsDragging(false);

        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
          inertiaAnimationRef.current.x = animate(x, newX + vx * 15, {
            type: "spring",
            velocity: vx,
            stiffness: 100,
            damping: 30,
            restDelta: 0.01
          });
          
          inertiaAnimationRef.current.y = animate(y, newY + vy * 15, {
            type: "spring",
            velocity: vy,
            stiffness: 100,
            damping: 30,
            restDelta: 0.01
          });
        }
      }

      return memo;
    },

    onPinch: ({ offset: [s], origin: [ox, oy], event }) => {
      if (draggingNodeId) return;
      
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
      bounds: undefined
    },
    wheel: {
      enabled: false
    },
    pinch: {
      eventOptions: { capture: true }
    }
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateZ(0)';
      containerRef.current.style.backfaceVisibility = 'hidden';
    }
    return () => {
      stopInertia();
    };
  }, [stopInertia, containerRef]);

  return bindGestures();
} 