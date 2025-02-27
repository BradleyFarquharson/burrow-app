import { NodeSize } from '@/config/nodeConfig';

export interface Node {
  id: string;
  title: string;      // Short, concise title
  content: string;    // Detailed content/description
  type: 'explore' | 'branch';
  position: {
    x: number;
    y: number;
  };
  size: NodeSize;
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