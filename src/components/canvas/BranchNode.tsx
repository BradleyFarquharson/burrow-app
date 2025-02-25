'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExplorationStore } from '@/store/explorationStore';
import { useGemini } from '@/hooks/useGemini';
import { Node } from '@/types';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import DragHandle from './DragHandle';
import { ConnectionAnchor } from './Connections';
import { useZoom } from '@/contexts';

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
  const { addBranchNodes, updateNodeQuestion, updateNodeContent, setActiveNode } = useExplorationStore();
  const { generateIdeas, isLoading } = useGemini();
  const [expanded, setExpanded] = useState<boolean>(false);
  
  // Get resetView function from our zoom context
  const { resetView } = useZoom();
  
  /**
   * Handle click on the node - only zoom without expanding
   */
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to draggable handler
    
    // Set this as the active node and zoom to it
    setActiveNode(node.id);
    resetView(node.id);
    
    // No longer toggling expanded state on general node click
  };
  
  /**
   * Generate sub-branches for this node using Gemini API
   */
  const handleExplore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a question for this branch
    const branchQuestion = `Tell me more about: ${node.content}`;
    
    // Save the question to the node
    updateNodeQuestion(node.id, branchQuestion);
    
    // Call Gemini API to generate sub-branches for this node
    const { answer, branches } = await generateIdeas(branchQuestion, node.id);
    
    // Update the node content with the answer
    updateNodeContent(node.id, answer);
    
    // Add branch nodes
    addBranchNodes(node.id, branches);
  };
  
  return (
    <>
      {/* Place the DragHandle outside the Card to prevent it from being hidden */}
      <DragHandle nodeId={node.id} />
      
      {/* Place the ConnectionAnchor outside the Card */}
      <ConnectionAnchor nodeId={node.id} position="left" />
    
      <Card 
        className={cn(
          "w-60 cursor-pointer transition-all shadow-md hover:shadow-lg relative",
          "card-container",
          // Highlight active node with a ring
          isActive && "ring-2 ring-border",
          expanded && "shadow-lg"
        )}
        onClick={(e) => {
          // Allow drag handle events to be processed by the drag handler
          const isGrabHandle = (e.target as HTMLElement).closest('[data-grab-handle="true"]');
          if (isGrabHandle) {
            // Don't do anything if clicking on drag handle
            e.stopPropagation();
            return;
          }
          
          // For other clicks, handle the node click (zoom)
          handleNodeClick(e);
        }}
        data-node-id={node.id}
      >
        <CardContent className="p-0 mt-6">
          {/* Node header with title and expand/collapse button */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-medium text-sm line-clamp-1">{node.content}</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-1 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </div>
          
          {/* Expandable content area */}
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "max-h-60" : "max-h-0"
          )}>
            <div className="p-3 space-y-3">
              {/* Display question and answer if they exist */}
              {node.question && node.content && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {node.question}
                  </p>
                  <p className="text-xs">{node.content}</p>
                </div>
              )}
              
              {/* Node description if available */}
              {node.description && !node.question && (
                <p className="text-xs text-muted-foreground">{node.description}</p>
              )}
              
              {/* Explore deeper button to generate sub-branches */}
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