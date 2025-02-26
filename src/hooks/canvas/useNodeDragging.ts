'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MotionValue } from 'framer-motion';
import { Node } from '@/types';
import { useExplorationStore } from '@/store/explorationStore';

/**
 * Props for the useNodeDragging hook
 */
interface UseNodeDraggingProps {
  /** Motion value for scale/zoom level */
  scale: MotionValue<number>;
  /** Motion value for X position */
  x: MotionValue<number>;
  /** Motion value for Y position */
  y: MotionValue<number>;
  /** Function to set the active node */
  setActiveNode: (nodeId: string) => void;
  /** Function to update a node's position */
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  /** Currently active node ID */
  activeNodeId: string;
}

/**
 * Return type for the useNodeDragging hook
 */
interface UseNodeDraggingReturn {
  /** ID of the node currently being dragged, if any */
  draggingNodeId: string | null;
  /** Handler for mouse down events on nodes */
  handleNodeMouseDown: (e: React.MouseEvent, node: Node) => void;
}

/**
 * Hook for handling node dragging interactions
 * 
 * Provides optimized node dragging functionality with:
 * - Individual node dragging without affecting other nodes
 * - Touch and mouse gesture support
 * - Optimized frame-rate with requestAnimationFrame
 * - Reduced re-renders for better performance
 * - Direct DOM manipulation for smoother dragging
 * - Proper handling of coordinate systems for selected nodes
 * 
 * @param props - Hook configuration props
 * @returns Object containing dragging state and event handlers
 */
export function useNodeDragging({
  scale,
  x,
  y,
  setActiveNode,
  updateNodePosition,
  activeNodeId
}: UseNodeDraggingProps): UseNodeDraggingReturn {
  // Track which node is being dragged
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Get the resolveCollisionsForNode function from the store
  const resolveCollisionsForNode = useExplorationStore((state) => state.resolveCollisionsForNode);
  
  // Use refs to track state without re-renders
  const draggedNodeRef = useRef<{
    nodeId: string,
    element: HTMLElement | null,
    startPos: { x: number, y: number },
    startMouse: { x: number, y: number },
    hasMoved: boolean,
    currentPos: { x: number, y: number },
    // Canvas state when dragging started - used for coordinate transformation
    canvasStartPos: { x: number, y: number },
    canvasStartScale: number,
    // Store whether this node was active when drag started
    wasActive: boolean
  } | null>(null);
  
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // Handle animation frame updates - batches DOM updates for better performance
  const updateNodeOnFrame = useCallback(() => {
    if (!isDraggingRef.current || !draggedNodeRef.current) return;
    
    const { nodeId, currentPos } = draggedNodeRef.current;
    
    // Only update the store if the position has actually changed
    // This reduces state updates and prevents unnecessary re-renders
    updateNodePosition(nodeId, { x: currentPos.x, y: currentPos.y });
    
    // Request next frame
    animationFrameRef.current = requestAnimationFrame(updateNodeOnFrame);
  }, [updateNodePosition]);
  
  // Process mouse movement - updates internal state but doesn't trigger re-renders
  const processMouseMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !draggedNodeRef.current) return;
    
    // Store last mouse position for velocity calculations if needed
    lastMousePosRef.current = { x: clientX, y: clientY };
    
    const { 
      startPos, 
      startMouse, 
      canvasStartPos, 
      canvasStartScale 
    } = draggedNodeRef.current;
    
    // Get current canvas scale
    const currentScale = scale.get();
    
    // Calculate distance moved in screen coordinates
    const screenDx = clientX - startMouse.x;
    const screenDy = clientY - startMouse.y;
    
    // Convert screen movement to canvas movement by dividing by scale
    // This accounts for canvas zoom level during dragging
    const canvasDx = screenDx / currentScale;
    const canvasDy = screenDy / currentScale;
    
    // Calculate new absolute position in canvas coordinates
    // This uses the original node position at drag start as the reference point
    const newX = startPos.x + canvasDx;
    const newY = startPos.y + canvasDy;
    
    // Update the current position in our ref
    draggedNodeRef.current.currentPos = { x: newX, y: newY };
    
    // Mark that this node has moved for click vs. drag detection
    if (Math.abs(canvasDx) > 3 || Math.abs(canvasDy) > 3) {
      draggedNodeRef.current.hasMoved = true;
      
      // Apply direct DOM manipulation for immediate feedback
      // This makes the dragging feel more responsive, while state updates
      // happen in animation frames for better performance
      if (draggedNodeRef.current.element) {
        // Apply direct style updates for immediate visual feedback
        // Note: Store updates still happen via updateNodeOnFrame
        draggedNodeRef.current.element.style.left = `${newX}px`;
        draggedNodeRef.current.element.style.top = `${newY}px`;
      }
    }
  }, [scale]);
  
  // Handle mouse move during drag - optimized to minimize work
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    // Prevent default browser behavior
    e.preventDefault();
    
    // Process the mouse movement - this updates internal refs but not state
    processMouseMove(e.clientX, e.clientY);
  }, [processMouseMove]);
  
  // Handle touch move for mobile devices - optimized similarly to mouse move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || !e.touches[0]) return;
    
    // Prevent default browser behavior (scrolling)
    e.preventDefault();
    
    // Get the first touch point
    const touch = e.touches[0];
    
    // Process the touch movement using the same logic as mouse movement
    processMouseMove(touch.clientX, touch.clientY);
  }, [processMouseMove]);
  
  // Clean up event listeners and animation frames
  const cleanupDrag = useCallback(() => {
    // Cancel any pending animation frames
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Remove event listeners with the same options used when adding them
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleTouchMove, { passive: false } as any);
    window.removeEventListener('touchend', handleTouchEnd);
    
    // Reset refs and state
    isDraggingRef.current = false;
  }, [handleMouseMove, handleTouchMove]);
  
  // Handle mouse up - finalize dragging
  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Only process if we were dragging
    if (isDraggingRef.current && draggedNodeRef.current) {
      // Prevent default browser behavior
      e.preventDefault();
      
      const { nodeId, hasMoved, currentPos } = draggedNodeRef.current;
      
      // Do one final position update to ensure store is in sync with DOM
      if (hasMoved && currentPos) {
        updateNodePosition(nodeId, currentPos);
        resolveCollisionsForNode(nodeId); // Resolve collisions here
      }
      
      // Reset state
      setDraggingNodeId(null);
      
      // Clean up drag-related resources and listeners
      cleanupDrag();
      
      // Clear the ref to show we're no longer tracking this node
      draggedNodeRef.current = null;
    }
  }, [updateNodePosition, resolveCollisionsForNode, cleanupDrag]);
  
  // Handle touch end - same as mouse up but for touch events
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Only process if we were dragging
    if (isDraggingRef.current && draggedNodeRef.current) {
      // Prevent default browser behavior
      e.preventDefault();
      
      const { nodeId, hasMoved, currentPos } = draggedNodeRef.current;
      
      // Do one final position update to ensure store is in sync with DOM
      if (hasMoved && currentPos) {
        updateNodePosition(nodeId, currentPos);
        resolveCollisionsForNode(nodeId); // Resolve collisions here
      }
      
      // Reset state
      setDraggingNodeId(null);
      
      // Clean up drag-related resources and listeners
      cleanupDrag();
      
      // Clear the ref to show we're no longer tracking this node
      draggedNodeRef.current = null;
    }
  }, [updateNodePosition, resolveCollisionsForNode, cleanupDrag]);
  
  // Handle initial mouse down on a node
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: Node) => {
    // Improved grab handle detection - check both the target and any parent up the tree
    const target = e.target as HTMLElement;
    const isGrabHandle = 
      target.hasAttribute('data-grab-handle') || 
      !!target.closest('[data-grab-handle="true"]');
    
    // If not clicking on a grab handle, don't handle dragging
    if (!isGrabHandle) {
      return;
    }
    
    // Always stop propagation for grab handle events to prevent canvas drag
    e.stopPropagation();
    e.preventDefault();
    
    // Get the element that will be dragged (the node container)
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
    
    if (nodeElement) {
      // Mark this node as being dragged
      setDraggingNodeId(node.id);
      
      // Unselect the node completely
      setActiveNode('');
      
      // Get current canvas state - important for coordinate transformation
      const currentCanvasX = x.get();
      const currentCanvasY = y.get();
      const currentScale = scale.get();
      
      // Set up the drag operation with canvas state
      draggedNodeRef.current = {
        nodeId: node.id,
        element: nodeElement,
        startPos: { ...node.position },
        startMouse: { x: e.clientX, y: e.clientY },
        hasMoved: false,
        currentPos: { ...node.position },
        canvasStartPos: { x: currentCanvasX, y: currentCanvasY },
        canvasStartScale: currentScale,
        wasActive: false // No longer track active state
      };
      
      isDraggingRef.current = true;
      
      // Start animation frame updates for smooth motion
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(updateNodeOnFrame);
      }
      
      // Add global event listeners with correct options
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
  }, [updateNodeOnFrame, handleMouseMove, handleTouchMove, setDraggingNodeId, x, y, scale, setActiveNode]);
  
  // Clean up event listeners if component unmounts during drag
  useEffect(() => {
    return () => {
      cleanupDrag();
    };
  }, [cleanupDrag]);
  
  return {
    draggingNodeId,
    handleNodeMouseDown
  };
} 