'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExplorationStore } from '@/store/explorationStore';
import { MessageSquare, X, Trash2, Plus, LogOut, Moon, Sun, Pencil, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
}

export default function SidePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedExplorations, setExpandedExplorations] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, isLoaded } = useTheme();
  
  const { 
    nodes, 
    activeNodeId, 
    setActiveNode, 
    explorations, 
    currentExplorationId,
    createNewExploration,
    deleteExploration,
    deleteNode,
    switchExploration,
    updateExplorationTitle
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
  
  const handleStartEdit = (explorationId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(explorationId);
    setEditTitle(currentTitle);
  };

  const handleSaveTitle = (explorationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      updateExplorationTitle(explorationId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (explorationId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle(explorationId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };
  
  // Don't render content until client-side and theme is loaded
  if (!mounted || !isLoaded) {
    return <div className="fixed top-0 left-0 h-full z-10 w-14"></div>;
  }
  
  return (
    <div className="sidebar-container">
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
      <div className={cn("sidebar-panel", isOpen && "open")}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Burrow</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-accent"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* New exploration button */}
          <div className="px-3 py-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-1.5 font-medium"
              onClick={() => {
                createNewExploration();
                setIsOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              New Exploration
            </Button>
          </div>

          {/* Divider */}
          <div className="px-4 py-2">
            <div className="h-px bg-border/60" />
          </div>

          {/* Explorations list */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 py-1">
              {explorationsWithMessages.length > 0 ? (
                explorationsWithMessages.map(([explorationId, exploration]) => (
                  <div 
                    key={explorationId}
                    className={cn(
                      "group rounded-md",
                      currentExplorationId === explorationId ? "bg-accent" : "hover:bg-accent/50",
                      "transition-colors"
                    )}
                  >
                    <div 
                      className="px-2 py-1.5 flex items-center cursor-pointer"
                      onClick={() => handleSwitchExploration(explorationId)}
                    >
                      <div className="flex-1 min-w-0">
                        {editingId === explorationId ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => handleKeyDown(explorationId, e)}
                            className="h-7 text-sm bg-background"
                            autoFocus
                          />
                        ) : (
                          <span className="block truncate text-sm">
                            {getExplorationTitle(exploration)}
                          </span>
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex items-center gap-0.5 ml-2",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity"
                      )}>
                        {editingId === explorationId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-background"
                            onClick={(e) => handleSaveTitle(explorationId, e)}
                          >
                            <span className="sr-only">Save</span>
                            ✓
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-background"
                            onClick={(e) => handleStartEdit(explorationId, getExplorationTitle(exploration), e)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-background hover:text-destructive"
                          onClick={(e) => handleDeleteExploration(explorationId, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-2 py-8 text-center text-muted-foreground">
                  <p className="text-sm">No explorations yet</p>
                  <p className="text-xs mt-1">Start by creating a new exploration</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              )}
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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