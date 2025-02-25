export interface Node {
  id: string;
  content: string;
  type: 'explore' | 'branch';
  position: Position;
  description?: string;
  question?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  source: string;
  target: string;
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
  connections: Connection[];
  activeNodeId: string;
} 