import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Exploration, Connection, Branch } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { NodeSize, DEFAULT_NODE_SIZE, NODE_SIZES } from '@/config/nodeConfig';

// Default position values that work on both server and client
const DEFAULT_X = 500;
const DEFAULT_Y = 300;

// Helper to calculate appropriate node size based on content
const calculateNodeSize = (node: Node): NodeSize => {
  // Calculate content length
  const contentLength = node.content?.length || 0;
  const questionLength = node.question?.length || 0;
  const descriptionLength = node.type === 'branch' ? 
    ('description' in node ? node.description?.length || 0 : 0) : 0;
  
  // Get the maximum content length
  const maxLength = Math.max(contentLength, questionLength, descriptionLength);
  
  // Select size based on content length
  if (maxLength > 400) return 'xl';
  if (maxLength > 300) return 'lg';
  if (maxLength > 200) return 'md';
  return 'sm';
};

// Helper Functions for collision detection and resolution
const getNodeSize = (node: Node): { width: number; height: number } => {
  const size = node.size || calculateNodeSize(node);
  const dimensions = NODE_SIZES[size];
  
  return {
    width: dimensions.width,
    height: node.question ? dimensions.maxHeight : dimensions.minHeight
  };
};

const doNodesOverlap = (node1: Node, node2: Node): boolean => {
  const size1 = getNodeSize(node1);
  const size2 = getNodeSize(node2);
  
  // Use the same buffer for both horizontal and vertical collision detection
  const buffer = 20; // 20px buffer on all sides
  
  const left1 = node1.position.x - size1.width / 2 - buffer;
  const right1 = node1.position.x + size1.width / 2 + buffer;
  const top1 = node1.position.y - size1.height / 2 - buffer;
  const bottom1 = node1.position.y + size1.height / 2 + buffer;
  
  const left2 = node2.position.x - size2.width / 2 - buffer;
  const right2 = node2.position.x + size2.width / 2 + buffer;
  const top2 = node2.position.y - size2.height / 2 - buffer;
  const bottom2 = node2.position.y + size2.height / 2 + buffer;
  
  // Check for overlap in both directions
  return left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;
};

const resolveCollisionsForNode = (nodes: Record<string, Node>, nodeId: string) => {
  const maxIterations = 10;
  let iteration = 0;
  let hasOverlaps = true;

  while (hasOverlaps && iteration < maxIterations) {
    hasOverlaps = false;
    iteration++;

    const movedNode = nodes[nodeId];
    if (!movedNode) return;

    // Find parent-child relationships for the moved node
    const store = useExplorationStore.getState();
    const connections = store.connections;
    const isParentChild = (node1Id: string, node2Id: string) => {
      return connections.some((conn: Connection) => 
        (conn.source === node1Id && conn.target === node2Id) ||
        (conn.source === node2Id && conn.target === node1Id)
      );
    };

    Object.values(nodes).forEach((otherNode) => {
      if (otherNode.id === nodeId) return;
      
      // Skip collision resolution for parent-child relationships
      if (isParentChild(movedNode.id, otherNode.id)) return;

      const size1 = getNodeSize(movedNode);
      const size2 = getNodeSize(otherNode);

      const left1 = movedNode.position.x - size1.width / 2;
      const right1 = movedNode.position.x + size1.width / 2;
      const top1 = movedNode.position.y - size1.height / 2;
      const bottom1 = movedNode.position.y + size1.height / 2;

      const left2 = otherNode.position.x - size2.width / 2;
      const right2 = otherNode.position.x + size2.width / 2;
      const top2 = otherNode.position.y - size2.height / 2;
      const bottom2 = otherNode.position.y + size2.height / 2;

      const overlapX = Math.min(right1, right2) - Math.max(left1, left2);
      const overlapY = Math.min(bottom1, bottom2) - Math.max(top1, top2);

      if (overlapX > 0 && overlapY > 0) {
        hasOverlaps = true;
        if (overlapX < overlapY) {
          const moveDirection = movedNode.position.x < otherNode.position.x ? -1 : 1;
          movedNode.position.x += moveDirection * overlapX;
        } else {
          const moveDirection = movedNode.position.y < otherNode.position.y ? -1 : 1;
          movedNode.position.y += moveDirection * overlapY;
        }
      }
    });
  }
};

export interface ExplorationState {
  // Explorations collection - each exploration is a separate chat
  explorations: Record<string, Exploration>;
  currentExplorationId: string | null;
  
  // Main data structure - nodes and their connections
  nodes: Record<string, Node>;
  
  // Active node that's currently being viewed
  activeNodeId: string;
  
  // Connections
  connections: Connection[];
  
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
  
  // Add a new action to handle repositioning nodes when one is expanded
  repositionOverlappingNodes: (expandedNodeId: string, expanded: boolean) => void;
  
  // New action for collision resolution
  resolveCollisionsForNode: (nodeId: string) => void;
  
  // Helper function to check if a node has children
  hasChildNodes: (nodeId: string) => boolean;
  
  // New action to manage connections
  setConnections: (newConnections: Connection[]) => void;
  
  // Add new actions for node sizing
  updateNodeSize: (nodeId: string, size: NodeSize) => void;
  
  // Add draggingNodeId
  draggingNodeId: string | null;
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
        size: DEFAULT_NODE_SIZE,
      },
    },
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
        
        // Active node that's currently being viewed
        activeNodeId: defaultExploration.activeNodeId,
        
        // Connections
        connections: [],
        
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
              [nodeId]: { ...state.nodes[nodeId], position },
            };
            const currentExplorationId = state.currentExplorationId;
            const explorations = currentExplorationId
              ? {
                  ...state.explorations,
                  [currentExplorationId]: {
                    ...state.explorations[currentExplorationId],
                    nodes: updatedNodes,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : state.explorations;
            return { nodes: updatedNodes, explorations };
          });
        },
        
        addBranchNodes: (parentId, branchNodes) => 
          set((state) => {
            const newNodes = { ...state.nodes };
            const newConnections = [...state.connections];
            const parentNode = newNodes[parentId];
            
            // Fixed spacing values
            const horizontalOffset = 700; // Adjusted for better balance
            const verticalSpacing = 160;
            
            // Calculate total height needed
            const totalNodes = branchNodes.length;
            const totalHeight = (totalNodes - 1) * verticalSpacing;
            
            // Calculate starting Y position to center the group
            const startY = parentNode.position.y - (totalHeight / 2);
            
            branchNodes.forEach((node, index) => {
              // Position each node
              node.position = {
                x: parentNode.position.x + horizontalOffset,
                y: startY + (index * verticalSpacing)
              };
              
              // Calculate appropriate size based on content
              node.size = calculateNodeSize(node);
              
              newNodes[node.id] = node;
              
              // Create a connection from parent to this node
              newConnections.push({ source: parentId, target: node.id });
            });
            
            const currentExplorationId = state.currentExplorationId;
            const explorations = currentExplorationId
              ? {
                  ...state.explorations,
                  [currentExplorationId]: {
                    ...state.explorations[currentExplorationId],
                    nodes: newNodes,
                    connections: newConnections,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : state.explorations;
            
            return { nodes: newNodes, connections: newConnections, explorations };
          }),
        
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
            let newActiveNodeId = state.activeNodeId;
            
            if (currentExplorationId === explorationId) {
              const remainingIds = Object.keys(updatedExplorations);
              if (remainingIds.length > 0) {
                // Switch to the first remaining exploration
                newCurrentId = remainingIds[0];
                const currentExploration = updatedExplorations[newCurrentId];
                newNodes = currentExploration.nodes;
                newActiveNodeId = currentExploration.activeNodeId;
              } else {
                // Create a new exploration if none left
                const newExploration = createDefaultExploration();
                updatedExplorations[newExploration.id] = newExploration;
                newCurrentId = newExploration.id;
                newNodes = newExploration.nodes;
                newActiveNodeId = newExploration.activeNodeId;
              }
            }
            
            return {
              explorations: updatedExplorations,
              currentExplorationId: newCurrentId,
              nodes: newNodes,
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
                activeNodeId: updatedActiveNodeId,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes: updatedNodes,
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
              activeNodeId: exploration.activeNodeId,
            };
          });
        },
        
        updateExplorationTitle: (explorationId, title) => {
          // Get current state
          const state = get();
          const { explorations } = state;
          
          // Check if exploration exists
          if (!explorations[explorationId]) {
            console.error('Exploration not found:', explorationId);
            return;
          }
          
          // Create updated exploration
          const updatedExploration = {
            ...explorations[explorationId],
            title,
            updatedAt: new Date().toISOString(),
          };
          
          // Create updated explorations
          const updatedExplorations = {
            ...explorations,
            [explorationId]: updatedExploration
          };
          
          // Log the update
          console.log(`Updating exploration ${explorationId} title to: "${title}"`);
          
          // Update the state in a single set call
          set({
            explorations: updatedExplorations
          });
        },
        
        // Add a new action to handle repositioning nodes when one is expanded
        repositionOverlappingNodes: (expandedNodeId, expanded) => {
          set((state) => {
            // If not expanded, we don't need to reposition
            if (!expanded) return state;
            
            const nodes = {...state.nodes};
            const expandedNode = nodes[expandedNodeId];
            if (!expandedNode) return state;
            
            // Define node dimensions based on type and expanded state
            const getNodeDimensions = (node: Node) => {
              const size = node.size || calculateNodeSize(node);
              const dimensions = NODE_SIZES[size];
              
              return {
                width: dimensions.width,
                height: node.question ? dimensions.maxHeight : dimensions.minHeight
              };
            };
            
            // Get dimensions of the expanded node
            const expandedDimensions = getNodeDimensions(expandedNode);
            
            // Create a safety buffer around the expanded node
            const buffer = 40; // Increased buffer for more spacing between nodes
            
            // Calculate expanded node bounds with buffer
            const expandedBounds = {
              left: expandedNode.position.x - expandedDimensions.width / 2 - buffer,
              right: expandedNode.position.x + expandedDimensions.width / 2 + buffer,
              top: expandedNode.position.y - expandedDimensions.height / 2 - buffer,
              bottom: expandedNode.position.y + expandedDimensions.height / 2 + buffer
            };
            
            // Find all nodes that need to be repositioned (nodes that overlap with the expanded node)
            const nodesToReposition = Object.values(nodes).filter(node => {
              if (node.id === expandedNodeId) return false; // Skip the expanded node itself
              
              const nodeDimensions = getNodeDimensions(node);
              
              // Calculate node bounds
              const nodeBounds = {
                left: node.position.x - nodeDimensions.width / 2,
                right: node.position.x + nodeDimensions.width / 2,
                top: node.position.y - nodeDimensions.height / 2,
                bottom: node.position.y + nodeDimensions.height / 2
              };
              
              // Check for overlap
              const overlapsHorizontally = 
                nodeBounds.right > expandedBounds.left && 
                nodeBounds.left < expandedBounds.right;
                
              const overlapsVertically = 
                nodeBounds.bottom > expandedBounds.top && 
                nodeBounds.top < expandedBounds.bottom;
                
              return overlapsHorizontally && overlapsVertically;
            });
            
            // Reposition overlapping nodes
            if (nodesToReposition.length > 0) {
              // For each overlapping node, move it away from the expanded node
              nodesToReposition.forEach(node => {
                // Calculate exactly how much to move to get out of overlap
                const dx = node.position.x - expandedNode.position.x;
                const dy = node.position.y - expandedNode.position.y;
                
                // Determine preferred direction to move: 
                // - If mostly aligned horizontally, move vertically
                // - If mostly aligned vertically, move horizontally
                let preferVertical = Math.abs(dy) <= Math.abs(dx);
                
                if (preferVertical) {
                  // Move vertically if nodes are more horizontally aligned
                  // Calculate exactly how much to move to get out of overlap
                  const verticalShift = dy >= 0 ? 
                    (expandedBounds.bottom - (node.position.y - expandedDimensions.height/2)) + buffer : 
                    -((node.position.y + expandedDimensions.height/2) - expandedBounds.top) - buffer;
                  
                  nodes[node.id] = {
                    ...node,
                    position: {
                      ...node.position,
                      y: node.position.y + verticalShift
                    }
                  };
                } else {
                  // Move horizontally if nodes are more vertically aligned
                  // Calculate exactly how much to move to get out of overlap
                  const horizontalShift = dx >= 0 ? 
                    (expandedBounds.right - (node.position.x - expandedDimensions.width/2)) + buffer : 
                    -((node.position.x + expandedDimensions.width/2) - expandedBounds.left) - buffer;
                  
                  nodes[node.id] = {
                    ...node,
                    position: {
                      ...node.position,
                      x: node.position.x + horizontalShift
                    }
                  };
                }
              });
            }
            
            // Also update the current exploration with the new node positions
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes: nodes,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return {
              nodes,
              explorations: updatedExplorations
            };
          });
        },
        
        // New action to resolve collisions for a node
        resolveCollisionsForNode: (nodeId) => {
          set((state) => {
            const nodes = { ...state.nodes };
            resolveCollisionsForNode(nodes, nodeId);
            const currentExplorationId = state.currentExplorationId;
            const explorations = currentExplorationId
              ? {
                  ...state.explorations,
                  [currentExplorationId]: {
                    ...state.explorations[currentExplorationId],
                    nodes,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : state.explorations;
            return { nodes, explorations };
          });
        },
        
        // Helper function to check if a node has children
        hasChildNodes: (nodeId: string) => {
          const { nodes } = get();
          
          // Check if there are any branch nodes that were created from this node
          // We do this by checking the positions of all branch nodes
          // If a branch node's x position is to the right of this node, and it's within a certain
          // vertical range, we consider it a child of this node
          
          const parentNode = nodes[nodeId];
          if (!parentNode) return false;
          
          // Get all branch nodes
          const branchNodes = Object.values(nodes).filter(node => 
            node.type === 'branch' && node.id !== nodeId
          );
          
          // Check if any branch node is positioned to the right of this node
          // with a horizontal offset that suggests it's a child
          const childNodes = branchNodes.filter(node => {
            // Horizontal check - node should be to the right of parent
            // Reduced the minimum distance to better detect children
            const isToTheRight = node.position.x > parentNode.position.x + 200;
            
            // Vertical check - node should be within a certain vertical range of parent
            // Increased vertical range to better detect children that might be positioned further up/down
            const verticalRange = 300; // Increased from 200
            const isWithinVerticalRange = 
              Math.abs(node.position.y - parentNode.position.y) < verticalRange;
            
            return isToTheRight && isWithinVerticalRange;
          });
          
          return childNodes.length > 0;
        },
        
        // New action to manage connections
        setConnections: (newConnections: Connection[]) => {
          set((state) => {
            const currentExplorationId = state.currentExplorationId;
            const explorations = currentExplorationId
              ? {
                  ...state.explorations,
                  [currentExplorationId]: {
                    ...state.explorations[currentExplorationId],
                    connections: newConnections,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : state.explorations;
            return { connections: newConnections, explorations };
          });
        },
        
        // Add new actions for node sizing
        updateNodeSize: (nodeId: string, size: NodeSize) => {
          set((state) => {
            const nodes = { ...state.nodes };
            if (nodes[nodeId]) {
              nodes[nodeId] = {
                ...nodes[nodeId],
                size,
              };
            }
            
            // Also update the current exploration
            const { currentExplorationId, explorations } = state;
            const updatedExplorations = currentExplorationId ? {
              ...explorations,
              [currentExplorationId]: {
                ...explorations[currentExplorationId],
                nodes,
                updatedAt: new Date().toISOString(),
              }
            } : explorations;
            
            return { nodes, explorations: updatedExplorations };
          });
        },
        
        // Add draggingNodeId
        draggingNodeId: null,
      };
    },
    {
      name: 'burrow-storage', // localStorage key
    }
  )
);

export { useExplorationStore }; 