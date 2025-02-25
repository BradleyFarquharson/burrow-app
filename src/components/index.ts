// Export main components directly
export { default as Canvas } from './Canvas';
export { default as ChatHistory } from './ChatHistory';

// Export canvas components individually to avoid case sensitivity issue
export {
  ExploreNode,
  BranchNode,
  NodeConnection,
  InfiniteGrid,
  ZoomControls,
  DragHandle
} from './canvas'; 