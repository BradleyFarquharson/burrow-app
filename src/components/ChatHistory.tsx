'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExplorationStore } from '@/store/explorationStore';
import { ChevronRight, MessageSquare, X, Trash2, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
}

export default function ChatHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedExplorations, setExpandedExplorations] = useState<Record<string, boolean>>({});
  
  const { 
    nodes, 
    activeNodeId, 
    setActiveNode, 
    explorations, 
    currentExplorationId,
    createNewExploration,
    deleteExploration,
    deleteNode,
    switchExploration
  } = useExplorationStore();
  
  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
    
    // Initialize expanded state for current exploration
    if (currentExplorationId) {
      setExpandedExplorations(prev => ({
        ...prev,
        [currentExplorationId]: true
      }));
    }
  }, []);
  
  // Update expanded state when current exploration changes
  useEffect(() => {
    if (currentExplorationId) {
      setExpandedExplorations(prev => ({
        ...prev,
        [currentExplorationId]: true
      }));
    }
  }, [currentExplorationId]);
  
  const handleNodeClick = (nodeId: string) => {
    setActiveNode(nodeId);
    // On mobile, close the panel after selecting a node
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };
  
  // Handle deleting a single burrow (node)
  const handleDeleteBurrow = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection
    deleteNode(nodeId);
  };
  
  // Handle creating a new exploration - no confirmation dialog
  const handleNewExploration = () => {
    createNewExploration();
  };
  
  // Handle deleting the current exploration - no confirmation dialog
  const handleDeleteExploration = (explorationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent exploration selection
    deleteExploration(explorationId);
  };
  
  // Handle switching to a different exploration
  const handleSwitchExploration = (explorationId: string) => {
    switchExploration(explorationId);
  };
  
  // Toggle expansion state of an exploration
  const toggleExpansion = (explorationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent switching exploration
    setExpandedExplorations(prev => ({
      ...prev,
      [explorationId]: !prev[explorationId]
    }));
  };
  
  // Get a display title for an exploration based on its first meaningful node
  const getExplorationTitle = (exploration: any) => {
    // Find the first node with a question
    const nodesWithQuestions = Object.values(exploration.nodes)
      .filter((node: any) => node.question);
    
    if (nodesWithQuestions.length > 0) {
      // Use the first node's question as the title
      const firstNode = nodesWithQuestions[0] as any;
      // Truncate to first 30 chars or first line
      const title = firstNode.question.split('\n')[0].substring(0, 30);
      return title + (title.length >= 30 ? '...' : '');
    }
    
    // Fallback to the default title
    return exploration.title;
  };
  
  // Don't render content until client-side
  if (!mounted) {
    return <div className="fixed top-0 left-0 h-full z-10 w-14"></div>;
  }
  
  return (
    <div className={cn(
      "fixed top-0 left-0 h-full z-10 transition-all duration-300 ease-in-out",
      isOpen ? "w-80" : "w-14"
    )}>
      {/* Toggle button - only visible when sidebar is closed */}
      {!isOpen && (
        <Button 
          variant="secondary" 
          size="lg" 
          className="absolute top-4 left-3 z-20 shadow-md rounded-full h-10 w-10 flex items-center justify-center"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
      
      {/* Panel content */}
      <div className={cn(
        "h-full bg-card border-r border-border shadow-lg transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Header with title and close button on the right */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Exploration History</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Action buttons */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={handleNewExploration}
          >
            <Plus className="h-3.5 w-3.5" />
            New Exploration
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100%-116px)]">
          <div className="p-4 space-y-4">
            {Object.keys(explorations).length > 0 ? (
              Object.entries(explorations).map(([explorationId, exploration]) => (
                <div 
                  key={explorationId}
                  className={cn(
                    "rounded-md border border-border",
                    currentExplorationId === explorationId ? "border-primary/50" : ""
                  )}
                >
                  {/* Exploration header */}
                  <div 
                    className={cn(
                      "p-2 flex items-center justify-between cursor-pointer hover:bg-accent rounded-t-md",
                      currentExplorationId === explorationId ? "bg-accent/50" : ""
                    )}
                    onClick={() => handleSwitchExploration(explorationId)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={(e) => toggleExpansion(explorationId, e)}
                      >
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            !expandedExplorations[explorationId] && "-rotate-90"
                          )} 
                        />
                      </Button>
                      <span className="font-medium text-sm truncate max-w-[180px]">
                        {getExplorationTitle(exploration)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteExploration(explorationId, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* Exploration nodes - only show if expanded */}
                  {expandedExplorations[explorationId] && (
                    <div className="p-2 space-y-2">
                      {Object.values(exploration.nodes)
                        .filter(node => node.question)
                        .map(node => (
                          <div 
                            key={node.id}
                            className={cn(
                              "p-2 rounded-md cursor-pointer transition-colors hover:bg-accent group",
                              activeNodeId === node.id ? "bg-accent" : ""
                            )}
                            onClick={() => handleNodeClick(node.id)}
                          >
                            <div className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="flex-1">
                                <p className="text-sm line-clamp-2">{node.question}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDeleteBurrow(node.id, e)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                      {Object.values(exploration.nodes)
                        .filter(node => node.question).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-xs">No messages in this exploration</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No explorations yet</p>
                <p className="text-xs mt-1">Start by asking a question</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 