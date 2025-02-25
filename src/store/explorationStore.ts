import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Connection, Exploration } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Default position values that work on both server and client
const DEFAULT_X = 500;
const DEFAULT_Y = 300;

interface ExplorationState {
  // Explorations collection - each exploration is a separate chat
  explorations: Record<string, Exploration>;
  currentExplorationId: string | null;
  
  // Main data structure - nodes and their connections
  nodes: Record<string, Node>;
  connections: Connection[];
  
  // Active node that's currently being viewed
  activeNodeId: string;
  
  // Actions
  setActiveNode: (nodeId: string) => void;
  updateNodeContent: (nodeId: string, content: string) => void;
  updateNodeQuestion: (nodeId: string, question: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  addBranchNodes: (parentId: string, branchNodes: Node[]) => void;
  clearExploration: () => void;
  
  // New actions for managing explorations
  createNewExploration: (title?: string) => void;
  deleteExploration: (explorationId: string) => void;
  deleteNode: (nodeId: string) => void;
  switchExploration: (explorationId: string) => void;
  updateExplorationTitle: (explorationId: string, title: string) => void;
}

// Create a default exploration
const createDefaultExploration = (): Exploration => {
  const id = uuidv4();
  return {
    id,
    title: `Exploration ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: {
      explore: {
        id: 'explore',
        content: 'Start your exploration here...',
        type: 'explore',
        position: { x: DEFAULT_X, y: DEFAULT_Y },
        width: 240, // w-60 = 15rem = 240px at default font size
        height: 140, // Explore nodes might be slightly taller
        // No question field by default - this will show the initial state
      },
    },
    connections: [],
    activeNodeId: 'explore',
  };
};

const useExplorationStore = create<ExplorationState>()(
  persist(
    (set, get) => {
      // Create initial exploration if none exists
      const defaultExploration = createDefaultExploration();
      
      return {
        // Explorations collection
        explorations: {
          [defaultExploration.id]: defaultExploration
        },
        currentExplorationId: defaultExploration.id,
        
        // Main data structure - nodes and their connections
        nodes: defaultExploration.nodes,
        connections: defaultExploration.connections,
        
        // Active node that's currently being viewed
        activeNodeId: defaultExploration.activeNodeId,
        
        // Actions
        setActiveNode: (nodeId) => {
          set({ activeNodeId: nodeId });
          
          // Also update the current exploration
          const { currentExplorationId, explorations } = get();
          if (currentExplorationId) {
            set({
              explorations: {
                ...explorations,
                [currentExplorationId]: {
                  ...explorations[currentExplorationId],
                  activeNodeId: nodeId,
                  updatedAt: new Date().toISOString(),
                }
              }
            });
          }
        },
        
        updateNodeContent: (nodeId, content) => {
          set((state) => {
            const updatedNodes = {
              ...state.nodes,
              [nodeId]: {
                ...state.nodes[nodeId],
                content,
              },
            };
            
            // Also update the current exploration
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes: updatedNodes,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes: updatedNodes,
              explorations: updatedExplorations,
            };
          });
        },
        
        updateNodeQuestion: (nodeId, question) => {
          set((state) => {
            const updatedNodes = {
              ...state.nodes,
              [nodeId]: {
                ...state.nodes[nodeId],
                question,
              },
            };
            
            // Also update the current exploration
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes: updatedNodes,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes: updatedNodes,
              explorations: updatedExplorations,
            };
          });
        },
        
        updateNodePosition: (nodeId, position) => {
          set((state) => {
            const updatedNodes = {
              ...state.nodes,
              [nodeId]: {
                ...state.nodes[nodeId],
                position,
              },
            };
            
            // Also update the current exploration
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes: updatedNodes,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes: updatedNodes,
              explorations: updatedExplorations,
            };
          });
        },
        
        addBranchNodes: (parentId, branchNodes) => {
          set((state) => {
            // Add new nodes and connections logic here
            const newNodes = {...state.nodes};
            const newConnections = [...state.connections];
            
            // Add all branch nodes
            branchNodes.forEach((node) => {
              newNodes[node.id] = node;
              newConnections.push({
                source: parentId,
                target: node.id
              });
            });
            
            // Also update the current exploration
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes: newNodes,
                connections: newConnections,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes: newNodes,
              connections: newConnections,
              explorations: updatedExplorations,
            };
          });
        },
        
        clearExploration: () => {
          // Create a new exploration instead of clearing the current one
          const { createNewExploration } = get();
          createNewExploration();
        },
        
        // New actions for managing explorations
        createNewExploration: (title) => {
          const newExploration = createDefaultExploration();
          if (title) {
            newExploration.title = title;
          }
          
          set((state) => ({
            explorations: {
              ...state.explorations,
              [newExploration.id]: newExploration
            },
            currentExplorationId: newExploration.id,
            nodes: newExploration.nodes,
            connections: newExploration.connections,
            activeNodeId: newExploration.activeNodeId,
          }));
        },
        
        deleteExploration: (explorationId) => {
          set((state) => {
            const { explorations, currentExplorationId } = state;
            const updatedExplorations = { ...explorations };
            delete updatedExplorations[explorationId];
            
            // If we're deleting the current exploration, switch to another one
            // or create a new one if there are none left
            let newCurrentId = currentExplorationId;
            let newNodes = state.nodes;
            let newConnections = state.connections;
            let newActiveNodeId = state.activeNodeId;
            
            if (currentExplorationId === explorationId) {
              const remainingIds = Object.keys(updatedExplorations);
              if (remainingIds.length > 0) {
                // Switch to the first remaining exploration
                newCurrentId = remainingIds[0];
                const currentExploration = updatedExplorations[newCurrentId];
                newNodes = currentExploration.nodes;
                newConnections = currentExploration.connections;
                newActiveNodeId = currentExploration.activeNodeId;
              } else {
                // Create a new exploration if none left
                const newExploration = createDefaultExploration();
                updatedExplorations[newExploration.id] = newExploration;
                newCurrentId = newExploration.id;
                newNodes = newExploration.nodes;
                newConnections = newExploration.connections;
                newActiveNodeId = newExploration.activeNodeId;
              }
            }
            
            return {
              explorations: updatedExplorations,
              currentExplorationId: newCurrentId,
              nodes: newNodes,
              connections: newConnections,
              activeNodeId: newActiveNodeId,
            };
          });
        },
        
        deleteNode: (nodeId) => {
          set((state) => {
            // Don't delete the last node
            if (Object.keys(state.nodes).length <= 1) {
              return state;
            }
            
            // Create new objects without the deleted node
            const updatedNodes = { ...state.nodes };
            delete updatedNodes[nodeId];
            
            // Remove any connections involving this node
            const updatedConnections = state.connections.filter(
              conn => conn.source !== nodeId && conn.target !== nodeId
            );
            
            // Update active node if needed
            let updatedActiveNodeId = state.activeNodeId;
            if (updatedActiveNodeId === nodeId) {
              // Set to the first available node
              updatedActiveNodeId = Object.keys(updatedNodes)[0];
            }
            
            // Also update the current exploration
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes: updatedNodes,
                connections: updatedConnections,
                activeNodeId: updatedActiveNodeId,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes: updatedNodes,
              connections: updatedConnections,
              activeNodeId: updatedActiveNodeId,
              explorations: updatedExplorations,
            };
          });
        },
        
        switchExploration: (explorationId) => {
          set((state) => {
            const { explorations } = state;
            const exploration = explorations[explorationId];
            
            if (!exploration) return state;
            
            return {
              currentExplorationId: explorationId,
              nodes: exploration.nodes,
              connections: exploration.connections,
              activeNodeId: exploration.activeNodeId,
            };
          });
        },
        
        updateExplorationTitle: (explorationId, title) => {
          set((state) => {
            const { explorations } = state;
            
            return {
              explorations: {
                ...explorations,
                [explorationId]: {
                  ...explorations[explorationId],
                  title,
                  updatedAt: new Date().toISOString(),
                }
              }
            };
          });
        },
      };
    },
    {
      name: 'burrow-storage', // localStorage key
    }
  )
);

export { useExplorationStore }; 