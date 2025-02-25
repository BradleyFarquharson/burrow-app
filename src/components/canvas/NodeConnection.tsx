'use client';

import { Node } from '@/types';

/**
 * Props for the NodeConnection component
 */
interface NodeConnectionProps {
  /** The source node where the connection starts */
  sourceNode: Node;
  /** The target node where the connection ends */
  targetNode: Node;
  /** The current scale factor of the canvas */
  scale: number;
}

/**
 * NodeConnection Component
 * 
 * Renders a curved connection line between two nodes on the canvas.
 * The connection is drawn as a quadratic bezier curve with appropriate
 * curvature based on the distance between nodes.
 * 
 * @param props - Component props
 * @returns React component that renders a connection between nodes
 */
export default function NodeConnection({ 
  sourceNode, 
  targetNode, 
  scale 
}: NodeConnectionProps): React.ReactElement {
  // Use absolute positions without scaling - the parent container handles scaling
  const startX = sourceNode.position.x;
  const startY = sourceNode.position.y;
  const endX = targetNode.position.x;
  const endY = targetNode.position.y;
  
  // Calculate the midpoint for the curved line
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // Add some curvature based on distance
  const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const curveFactor = Math.min(0.2, 30 / distance);
  
  // Calculate control point for the curve (perpendicular to the line)
  const dx = endX - startX;
  const dy = endY - startY;
  const controlX = midX - dy * curveFactor;
  const controlY = midY + dx * curveFactor;
  
  // Create the path for a quadratic bezier curve
  const path = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`;
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Connection line - using border color from theme */}
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--border))" // Using border color for connection lines
        strokeWidth={1.5} // Fixed width - scaling happens from parent container
        strokeDasharray="5,5" // Dashed line for visual distinction
        strokeLinecap="round"
      />
      
      {/* Small dot at the end of the connection */}
      <circle
        cx={endX}
        cy={endY}
        r={2} // Fixed radius - scaling happens from parent container
        fill="hsl(var(--border))" // Using border color for the endpoint dot
        opacity="0.5" // Slightly transparent
      />
    </svg>
  );
} 