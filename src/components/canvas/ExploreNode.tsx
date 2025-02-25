'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExplorationStore } from '@/store/explorationStore';
import { useGemini } from '@/hooks/useGemini';
import { Node } from '@/types';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import DragHandle from './DragHandle';
import { ConnectionAnchor } from './Connections';
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
  
  const { addBranchNodes, updateNodeContent, updateNodeQuestion, setActiveNode } = useExplorationStore();
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
      {/* Place the DragHandle outside the Card to prevent it from being hidden */}
      <DragHandle nodeId={node.id} />
      
      {/* Place the ConnectionAnchor outside the Card */}
      <ConnectionAnchor nodeId={node.id} position="right" />
      
      <Card 
        className={cn(
          "shadow-lg relative transition-all duration-300 ease-in-out",
          "card-container", // Add card-container class for glow effect
          isExpanded ? "w-96" : "w-80",
          isActive && "ring-2 ring-primary"
        )}
        onClick={(e) => {
          // Check if click was on drag handle
          const isGrabHandle = (e.target as HTMLElement).closest('[data-grab-handle="true"]');
          if (isGrabHandle) {
            // Don't activate the node if clicking on drag handle
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
        <CardContent className={cn(
          "p-4",
          isExpanded ? "pt-8" : "pt-4 pb-4"
        )}>
          {/* Display question and answer if they exist */}
          {isExpanded ? (
            <div className="space-y-4 transition-all duration-300 ease-in-out">
              {/* Question section - bold at the top */}
              <div className="space-y-3">
                <p className="text-sm font-bold px-1">{node.question}</p>
                
                {/* Small centered divider */}
                <div className="flex justify-center">
                  <div className="w-16 h-px bg-border"></div>
                </div>
              </div>
              
              {/* Thinking indicator or answer */}
              {showThinking || isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <p className="text-sm px-1 leading-relaxed">{node.content}</p>
              )}
            </div>
          ) : (
            // Initial state - just the input pill
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ask a question to start exploring..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-full"
              />
              <Button 
                size="icon"
                variant="ghost"
                onClick={handleExplore} 
                disabled={isLoading || !question.trim()}
                className="rounded-full h-9 w-9 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
} 