'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExplorationStore } from '@/store/explorationStore';
import { useGemini } from '@/hooks/useGemini';
import { Node } from '@/types';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import DragHandle from './DragHandle';
import AnchorDot from './AnchorDot';
import { useZoom } from '@/contexts';
import { getNodeSizeClasses, getNodeMaxHeight } from '@/config/nodeConfig';

/**
 * Props for the BranchNode component
 */
interface BranchNodeProps {
  /** The node data to display */
  node: Node;
  /** Whether this node is currently active */
  isActive: boolean;
}

/**
 * BranchNode Component
 * 
 * Represents a node in the exploration tree that can be expanded to show more details
 * and can generate sub-branches through the Gemini API.
 * 
 * @param props - Component props
 * @returns React component that renders a branch node
 */
export default function BranchNode({ node, isActive }: BranchNodeProps): React.ReactElement {
  const { 
    addBranchNodes, 
    updateNodeQuestion, 
    updateNodeContent, 
    setActiveNode,
    repositionOverlappingNodes,
    hasChildNodes,
    draggingNodeId
  } = useExplorationStore();
  const { generateIdeas, isLoading } = useGemini();
  const [expanded, setExpanded] = useState<boolean>(false);
  
  const hasChildren = useMemo(() => hasChildNodes(node.id), [node.id, hasChildNodes]);
  const { resetView } = useZoom();
  
  const handleNodeClick = (e: React.MouseEvent) => {
    const isGrabHandle = (e.target as HTMLElement).closest('[data-grab-handle="true"]');
    const isAnchorDot = (e.target as HTMLElement).closest('[data-anchor-dot="true"]');
    
    if (isGrabHandle || isAnchorDot) {
      e.stopPropagation();
      return;
    }
    
    e.stopPropagation();
    setActiveNode(node.id);
    resetView(node.id);
  };
  
  const handleExplore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a question that explores this specific subtopic
    const branchQuestion = `Explore in detail: ${node.title}`;
    
    updateNodeQuestion(node.id, branchQuestion);
    
    const { answer, branches } = await generateIdeas(branchQuestion, node.id);
    
    updateNodeContent(node.id, answer);
    addBranchNodes(node.id, branches);
  };

  return (
    <>
      <DragHandle nodeId={node.id} />
      
      <Card 
        className={cn(
          "shadow-md relative",
          "card-container",
          "w-[400px]",
          isActive && "ring-2 ring-primary",
          "overflow-visible"
        )}
        style={{ 
          position: 'relative', 
          zIndex: 1,
          transition: 'filter 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
        }}
        onClick={handleNodeClick}
        data-node-id={node.id}
      >
        <AnchorDot nodeId={node.id} position="left" />
        <AnchorDot nodeId={node.id} position="right" />
        
        <CardContent className="p-0">
          <div className="p-3 pr-6 flex items-center justify-between gap-2 relative">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold break-words">
                {node.title}
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 flex-shrink-0 absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
                if (!draggingNodeId) {
                  repositionOverlappingNodes(node.id, !expanded);
                }
              }}
            >
              {expanded ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </div>
          <div className="px-3">
            {expanded && <div className="h-px bg-border/60" />}
          </div>
          
          <div 
            className={cn(
              "overflow-hidden transition-all duration-300"
            )}
            style={{
              maxHeight: expanded ? 'none' : 0
            }}
          >
            <div className="p-3 space-y-3 overflow-y-auto hover-scrollbar" 
              style={{ 
                maxHeight: expanded ? '600px' : '0px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
              {node.content && (
                <p className="text-base font-medium break-words">
                  {node.content}
                </p>
              )}
              
              <Button 
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1 border-border hover:bg-muted" 
                onClick={handleExplore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Exploring...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Explore Deeper
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 