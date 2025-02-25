import React, { createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { MotionValue, animate } from 'framer-motion';

interface ZoomContextProps {
  resetView: (nodeId: string) => void;
}

const ZoomContext = createContext<ZoomContextProps | undefined>(undefined);

interface ZoomProviderProps {
  children: ReactNode;
  scale: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  nodes: Record<string, { id: string; position: { x: number; y: number } }>;
}

export function ZoomProvider({ children, scale, x, y, nodes }: ZoomProviderProps) {
  // Reset view to center on a specific node
  const resetView = useCallback((nodeId: string) => {
    const node = nodes[nodeId];
    
    if (node) {
      // Use framer-motion's animate for smooth transitions
      animate(x, window.innerWidth / 2 - node.position.x);
      animate(y, window.innerHeight / 2 - node.position.y);
      animate(scale, 1);
    }
  }, [nodes, x, y, scale]);

  const value = {
    resetView,
  };

  return (
    <ZoomContext.Provider value={value}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
} 