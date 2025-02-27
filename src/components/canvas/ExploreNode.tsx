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
import { getNodeSizeClasses } from '@/config/nodeConfig';

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
    hasChildNodes,
    draggingNodeId
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
    // Don't reposition if we're dragging
    if (draggingNodeId) return;
    repositionOverlappingNodes(node.id, isExpanded);
  }, [isExpanded, node.id, repositionOverlappingNodes, draggingNodeId]);
  
  /**
   * Handles the exploration action when a question is submitted
   * Generates new branch nodes based on the question
   */
  const handleExplore = async (): Promise<void> => {
    if (!question.trim()) return;
    
    // Batch state updates before API call
    const updates = {
      question: question.trim(),
      isExpanded: true,
      showThinking: true
    };
    
    updateNodeQuestion(node.id, updates.question);
    setIsExpanded(updates.isExpanded);
    setShowThinking(updates.showThinking);
    
    try {
      // Call Gemini API with the current node ID as parent
      const { answer, branches } = await generateIdeas(updates.question, node.id);
      
      // Batch state updates after API call
      updateNodeContent(node.id, answer);
      addBranchNodes(node.id, branches);
      setShowThinking(false);
      setQuestion('');
    } catch (error) {
      console.error('Error in exploration:', error);
      setShowThinking(false);
    }
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
          "shadow-lg relative",
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
      >
        {/* Always show right anchor dot for the explore node */}
        <AnchorDot 
          nodeId={node.id} 
          position="right" 
        />
        
        <CardContent className="p-0">
          {/* Node content */}
          {node.question ? (
            <>
              <div className="p-3">
                <h3 className="text-lg font-bold break-words">
                  {node.question}
                </h3>
              </div>
              <div className="px-3">
                <div className="h-px bg-border/60" />
              </div>
              <div className="p-3">
                {showThinking ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <div className="text-base animate-pulse">Pondering your question...</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
                    </div>
                  </div>
                ) : (
                  <p className="text-base font-medium break-words">
                    {node.content}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="p-3">
              {/* Initial state with input */}
              <div className="relative">
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
              
              {/* Thinking/loading state */}
              {showThinking && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg animate-in fade-in duration-300 mt-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <div>Exploring your question...</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
} 