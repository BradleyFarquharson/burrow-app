'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExplorationStore } from '@/store/explorationStore';
import { useGemini } from '@/hooks/useGemini';
import { Node } from '@/types';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import DragHandle from './DragHandle';
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
  const { addBranchNodes, updateNodeContent, updateNodeQuestion, setActiveNode } = useExplorationStore();
  const { generateIdeas, isLoading } = useGemini();
  
  // Get the resetView function from our context
  const { resetView } = useZoom();
  
  /**
   * Handles the exploration action when a question is submitted
   * Generates new branch nodes based on the question
   */
  const handleExplore = async (): Promise<void> => {
    if (!question.trim()) return;
    
    // Save the question to the node
    updateNodeQuestion(node.id, question);
    
    // Call Gemini API with the current node ID as parent
    const { answer, branches } = await generateIdeas(question, node.id);
    
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
  
  return (
    <Card 
      className={cn(
        "w-72 shadow-lg relative",
        isActive && "ring-2 ring-primary"
      )}
      onClick={(e) => {
        // Allow drag handle events to be processed by the drag handler
        const isGrabHandle = (e.target as HTMLElement).closest('[data-grab-handle="true"]');
        if (isGrabHandle) {
          // Don't do anything if clicking on drag handle
          return;
        }
        
        // For other clicks, zoom to the node
        e.stopPropagation();
        resetView(node.id);
      }}
      data-node-id={node.id}
    >
      {/* Use the reusable DragHandle component */}
      <DragHandle nodeId={node.id} />
      
      <CardContent className="p-4 pt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Explore</h3>
          {isActive && (
            <div className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              Active
            </div>
          )}
        </div>
        
        {/* Display question and answer if they exist */}
        {node.question ? (
          <div className="space-y-3">
            {/* Question section */}
            <div className="bg-muted/50 p-3 rounded-md border border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Question</h4>
              <p className="text-sm font-medium">{node.question}</p>
            </div>
            
            {/* Answer section */}
            <div className="bg-card/50 p-3 rounded-md border border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Answer</h4>
              <p className="text-sm">{node.content}</p>
            </div>
          </div>
        ) : (
          // Initial state - no question asked yet
          <div className="mb-4 bg-card/50 p-3 rounded-md border border-border">
            <p className="text-sm text-muted-foreground italic">
              Ask a question to start exploring...
            </p>
          </div>
        )}
        
        {/* Only show input if no question has been asked yet */}
        {!node.question && (
          <div className="space-y-2 mt-3">
            <div className="relative">
              <Input
                placeholder="Ask anything..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10"
              />
              {question.trim() && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute right-1 top-1 h-6 w-6 p-0" 
                  onClick={() => setQuestion('')}
                >
                  ×
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleExplore} 
              disabled={isLoading || !question.trim()}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Thinking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Explore
                </span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 