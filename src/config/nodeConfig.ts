export type NodeSize = 'sm' | 'md' | 'lg' | 'xl';

export interface NodeDimensions {
  width: number;      // Width in pixels
  maxHeight: number;  // Maximum height in pixels when expanded
  minHeight: number;  // Minimum height in pixels when collapsed
}

export const NODE_SIZES: Record<NodeSize, NodeDimensions> = {
  sm: {
    width: 240,     // 15rem
    maxHeight: 320,
    minHeight: 140,
  },
  md: {
    width: 320,     // 20rem
    maxHeight: 400,
    minHeight: 140,
  },
  lg: {
    width: 400,     // 25rem
    maxHeight: 480,
    minHeight: 140,
  },
  xl: {
    width: 480,     // 30rem
    maxHeight: 560,
    minHeight: 140,
  },
} as const;

// Default size for new nodes
export const DEFAULT_NODE_SIZE: NodeSize = 'md';

// Helper to get CSS classes for node sizes
export const getNodeSizeClasses = (size: NodeSize): string => {
  const widthClasses: Record<NodeSize, string> = {
    sm: 'w-60',  // 15rem = 240px
    md: 'w-80',  // 20rem = 320px
    lg: 'w-[400px]',
    xl: 'w-[480px]',
  };

  return widthClasses[size];
};

// Helper to get max height for expanded state
export const getNodeMaxHeight = (size: NodeSize = DEFAULT_NODE_SIZE): string => {
  // If size is invalid, fallback to default size
  if (!NODE_SIZES[size]) {
    size = DEFAULT_NODE_SIZE;
  }
  const maxHeight = NODE_SIZES[size].maxHeight;
  return `${maxHeight}px`;
}; 