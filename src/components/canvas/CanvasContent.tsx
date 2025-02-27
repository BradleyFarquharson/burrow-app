'use client';

import React, { useCallback } from 'react';
import { Node } from '@/types';
import { cn } from '@/lib/utils';
import ExploreNode from './ExploreNode';
import BranchNode from './BranchNode';
import NodeConnections from './NodeConnections';

interface CanvasContentProps {
  nodes: Record<string, Node>;
  activeNodeId: string;
  draggingNodeId: string | null;
  handleNodeMouseDown: (e: React.MouseEvent, node: Node) => void;
}

const CanvasContent = React.memo(({ 
  nodes, 
  activeNodeId, 
  draggingNodeId, 
  handleNodeMouseDown 
}: CanvasContentProps) => {
  const renderNode = useCallback((node: Node): React.ReactElement => {
    const isActive = node.id === activeNodeId;
    const isDragging = draggingNodeId === node.id;
    
    return (
      <div 
        key={node.id}
        data-node-id={node.id}
        className={cn(
          isActive && "node-active"
        )}
        style={{ 
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          transform: `translate(-50%, -50%)`,
          transformOrigin: 'center',
          cursor: isDragging ? 'grabbing' : 'pointer',
          zIndex: isDragging ? 10 : 1,
          filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))' : 'none',
          willChange: 'transform',
          transition: isDragging ? 'none' : 'filter 0.2s ease'
        }}
        onMouseDown={(e: React.MouseEvent): void => {
          const target = e.target as HTMLElement;
          const isGrabHandle = 
            target.hasAttribute('data-grab-handle') || 
            !!target.closest('[data-grab-handle="true"]');
          
          if (isGrabHandle) {
            e.stopPropagation();
            e.preventDefault();
            handleNodeMouseDown(e, node);
          }
        }}
        onTouchStart={(e: React.TouchEvent): void => {
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const isGrabHandle = element?.closest('[data-grab-handle="true"]');
          
          if (isGrabHandle) {
            e.stopPropagation();
            e.preventDefault();
            
            const mouseEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              stopPropagation: () => e.stopPropagation(),
              target: element,
              preventDefault: () => e.preventDefault(),
            } as any;
            handleNodeMouseDown(mouseEvent, node);
          }
        }}
      >
        {node.type === 'explore' ? (
          <ExploreNode
            node={node}
            isActive={isActive}
          />
        ) : (
          <BranchNode
            node={node}
            isActive={isActive}
          />
        )}
      </div>
    );
  }, [activeNodeId, draggingNodeId, handleNodeMouseDown]);

  return (
    <>
      <NodeConnections />
      {Object.values(nodes).map(renderNode)}
    </>
  );
});

CanvasContent.displayName = 'CanvasContent';

export default CanvasContent; 