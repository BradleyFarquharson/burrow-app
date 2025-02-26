'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExplorationStore } from '@/store/explorationStore';
import { ChevronRight, MessageSquare, X, Trash2, Plus, ChevronDown, LogOut, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
}

export default function SidePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedExplorations, setExpandedExplorations] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, isLoaded, isChanging } = useTheme();
  
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
    setIsOpen(false); // Close the sidebar
    // Logic to focus on input for new message (implementation needed)
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
  const getExplorationTitle = (exploration: { nodes: Record<string, { question?: string }> }): string => {
    // Find the first node with a question
    const nodesWithQuestions = Object.values(exploration.nodes)
      .filter((node) => node.question);

    if (nodesWithQuestions.length > 0) {
      // Use the first node's question as the title
      return nodesWithQuestions[0].question || '';
    }

    // Fallback to an empty string if no question is found
    return '';
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Explicitly redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
    }
  };
  
  // Filter explorations to only show those with messages
  const explorationsWithMessages = Object.entries(explorations).filter(([, exploration]) =>
    Object.values(exploration.nodes).some(node => node.question)
  );
  
  // Don't render content until client-side and theme is loaded
  if (!mounted || !isLoaded) {
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
          variant="ghost" 
          size="lg" 
          className="absolute top-4 left-3 z-20 shadow-md rounded-md h-10 w-10 flex items-center justify-center bg-card border border-border"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
      
      {/* Panel content */}
      <div className={cn(
        "h-full bg-card border-r border-border shadow-lg transition-opacity flex flex-col",
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
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {explorationsWithMessages.length > 0 ? (
              explorationsWithMessages.map(([explorationId, exploration]) => (
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
        
        {/* Footer with theme toggle and logout button */}
        <div className="p-3 border-t border-border mt-auto space-y-2">
          {/* Theme toggle button */}
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "w-full gap-2 text-muted-foreground hover:text-foreground",
              isChanging && "opacity-70 pointer-events-none"
            )}
            onClick={toggleTheme}
            disabled={isChanging}
          >
            {isChanging ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-t-2 border-current"></div>
                <span>Changing...</span>
              </>
            ) : theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Light Mode</span>
              </>
            )}
          </Button>
          
          {/* Logout button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-t-2 border-current"></div>
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 