export interface Node {
  id: string;
  content: string;
  type: 'explore' | 'branch';
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  description?: string;
  question?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Branch {
  title: string;
  description: string;
}

export interface GeminiResponse {
  answer: string;
  branches: Branch[];
}

export interface Exploration {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  nodes: Record<string, Node>;
  activeNodeId: string;
}

/**
 * Connection between nodes
 */
export interface Connection {
  source: string; // ID of the source node
  target: string; // ID of the target node
} 