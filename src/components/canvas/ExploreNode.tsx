'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExplorationStore } from '@/store/explorationStore';
import { useGemini } from '@/hooks/useGemini';
import { Node } from '@/types';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import DragHandle from './DragHandle';
import AnchorDot from './AnchorDot';
import { useZoom } from '@/contexts';

/**
 * Props for the ExploreNode component
 */
interface ExploreNodeProps {
  /** The node data to display */
  node: Node;
  /** Whether this node is currently active */
  isActive: boolean;
}

/**
 * ExploreNode Component
 * 
 * Displays an exploration node with content and a question input.
 * Allows users to ask questions and generate new branch nodes.
 * 
 * @param props - Component props
 * @returns React component that renders an exploration node
 */
export default function ExploreNode({ node, isActive }: ExploreNodeProps): React.ReactElement {
  const [question, setQuestion] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(!!node.question);
  const [showThinking, setShowThinking] = useState<boolean>(false);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if this node has children using the store's hasChildNodes function
  const { 
    addBranchNodes, 
    updateNodeContent, 
    updateNodeQuestion, 
    setActiveNode,
    repositionOverlappingNodes,
    hasChildNodes
  } = useExplorationStore();
  
  // Check if the explore node has children
  const hasChildren = useMemo(() => hasChildNodes(node.id), [node.id, hasChildNodes]);
  
  const { generateIdeas, isLoading } = useGemini();
  
  // Get the resetView function from our context
  const { resetView } = useZoom();
  
  // Clear thinking timer on unmount
  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
      }
    };
  }, []);
  
  // Effect to call repositionOverlappingNodes when isExpanded changes
  useEffect(() => {
    repositionOverlappingNodes(node.id, isExpanded);
  }, [isExpanded, node.id, repositionOverlappingNodes]);
  
  /**
   * Handles the exploration action when a question is submitted
   * Generates new branch nodes based on the question
   */
  const handleExplore = async (): Promise<void> => {
    if (!question.trim()) return;
    
    // Save the question to the node
    updateNodeQuestion(node.id, question);
    
    // Expand the node
    setIsExpanded(true);
    
    // Set a timer to show the thinking UI if the response takes longer than 300ms
    thinkingTimerRef.current = setTimeout(() => {
      setShowThinking(true);
    }, 300);
    
    // Call Gemini API with the current node ID as parent
    const { answer, branches } = await generateIdeas(question, node.id);
    
    // Clear the thinking timer and hide the thinking UI
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    setShowThinking(false);
    
    // Update the explore node with the answer
    updateNodeContent(node.id, answer);
    
    // Add the branch nodes
    addBranchNodes(node.id, branches);
    
    // Clear the question input
    setQuestion('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && question.trim()) {
      e.preventDefault();
      handleExplore();
    }
  };
  
  // Render the explore node
  return (
    <>
      {/* Place the DragHandle outside the Card */}
      <DragHandle nodeId={node.id} />
      
      <Card 
        className={cn(
          "shadow-lg relative transition-all duration-300 ease-in-out",
          "card-container", // Add card-container class for glow effect
          isExpanded ? "w-96" : "w-80",
          isActive && "ring-2 ring-primary",
          "overflow-visible" // Ensure overflow is visible
        )}
        onClick={(e) => {
          // Check if click was on drag handle or anchor dot
          const isGrabHandle = (e.target as HTMLElement).closest('[data-grab-handle="true"]');
          const isAnchorDot = (e.target as HTMLElement).closest('[data-anchor-dot="true"]');
          
          if (isGrabHandle || isAnchorDot) {
            // Don't activate the node if clicking on drag handle or anchor dot
            e.stopPropagation();
            return;
          }
          
          // This handler will only zoom to the node
          e.stopPropagation(); // Prevent event from bubbling up to draggable handler
          
          // Set this as the active node and zoom to it
          setActiveNode(node.id);
        }}
        data-node-id={node.id}
        style={{ position: 'relative', zIndex: 1 }} // Ensure proper stacking context
      >
        {/* Always show right anchor dot for the explore node */}
        <AnchorDot 
          nodeId={node.id} 
          position="right" 
        />
        
        <CardContent className="p-4 space-y-4">
          {/* Node title */}
          {node.content && (
            <div className="text-sm font-medium break-words">
              {node.content}
            </div>
          )}
          
          {/* Show question and answer */}
          {node.question && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">
                {node.question}
              </div>
              <div className="text-xs">{node.content}</div>
            </div>
          )}
          
          {/* Thinking/loading state */}
          {showThinking && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <div>Thinking...</div>
            </div>
          )}
          
          {/* Question input */}
          <div className="relative mt-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="pr-10 text-sm"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleExplore()}
                disabled={!question.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 