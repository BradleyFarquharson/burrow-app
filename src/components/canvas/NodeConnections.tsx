'use client';

import React, { useEffect, useState } from 'react';
import { useExplorationStore } from '@/store/explorationStore';
import { Node } from '@/types';
import SmoothCircle from './SmoothCircle';
import { NODE_SIZES, DEFAULT_NODE_SIZE } from '@/config/nodeConfig';

interface StableConnection {
  source: string;
  target: string;
}

/**
 * NodeConnections Component
 * 
 * Handles both the connection logic and rendering of node connections.
 * Maintains parent-child relationships and renders connection lines properly aligned with anchor dots.
 */
export default function NodeConnections(): React.ReactElement {
  const { nodes, connections, setConnections } = useExplorationStore();
  const [stableConnections, setStableConnections] = useState<StableConnection[]>(connections);
  const [points, setPoints] = useState<{ x: number; y: number; source: string; target: string; id: number; relativePosition: number }[]>([]);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  
  // Calculate connections once when nodes are added/removed
  useEffect(() => {
    // Use stored connections directly
    setStableConnections(connections);
  }, [connections]);
  
  // Remove getNodeWidth as it's no longer needed
  const ANCHOR_OFFSET = 14; // Fixed offset matching AnchorDot's CSS positioning

  // Anchor position calculation using node width for edge positioning
  const getAnchorPosition = (node: Node, position: 'source' | 'target'): { x: number; y: number } => {
    const width = 400; // Fixed width matching the Card components
    return {
      // Calculate based on node edges
      x: node.position.x + (position === 'source' ? width / 2 : -width / 2),
      y: node.position.y
    };
  };
  
  // Update dot positions when nodes are moved
  useEffect(() => {
    const updateDotPositions = () => {
      setPoints((prevPoints) =>
        prevPoints.map((point) => {
          const connection = stableConnections.find(conn => conn.source === point.source && conn.target === point.target);
          if (!connection) return point;

          const sourceNode = nodes[connection.source];
          const targetNode = nodes[connection.target];
          if (!sourceNode || !targetNode) return point;

          // Get exact anchor positions
          const sourceAnchor = getAnchorPosition(sourceNode, 'source');
          const targetAnchor = getAnchorPosition(targetNode, 'target');

          // Calculate the relative position of the point on the Bezier curve
          const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathElement.setAttribute('d', `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceAnchor.x + 50} ${sourceAnchor.y}, ${targetAnchor.x - 50} ${targetAnchor.y}, ${targetAnchor.x} ${targetAnchor.y}`);
          const totalLength = pathElement.getTotalLength();
          const pointAtLength = pathElement.getPointAtLength(totalLength * point.relativePosition);

          return { ...point, x: pointAtLength.x, y: pointAtLength.y };
        })
      );
    };

    updateDotPositions();
  }, [nodes, stableConnections]);
  
  // Utility function for throttling
  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // New function to render a connection group inside a single SVG container
  const renderConnectionGroup = (sourceNodeId: string, targetNodeId: string, key: string) => {
    const sourceNode = nodes[sourceNodeId];
    const targetNode = nodes[targetNodeId];

    if (!sourceNode || !targetNode) {
      return null;
    }

    // Get exact anchor positions
    const sourceAnchor = getAnchorPosition(sourceNode, 'source');
    const targetAnchor = getAnchorPosition(targetNode, 'target');

    const distance = Math.sqrt(Math.pow(targetAnchor.x - sourceAnchor.x, 2) + Math.pow(targetAnchor.y - sourceAnchor.y, 2));
    const dynamicControlPointOffset = Math.min(50, distance / 4);

    const controlPointX1 = sourceAnchor.x + dynamicControlPointOffset;
    const controlPointX2 = targetAnchor.x - dynamicControlPointOffset;
    const path = `M ${sourceAnchor.x} ${sourceAnchor.y} C ${controlPointX1} ${sourceAnchor.y}, ${controlPointX2} ${targetAnchor.y}, ${targetAnchor.x} ${targetAnchor.y}`;

    const isNearPath = (x: number, y: number): boolean => {
      const tolerance = 15;
      const distToControl1 = Math.sqrt(Math.pow(x - controlPointX1, 2) + Math.pow(y - sourceAnchor.y, 2));
      const distToControl2 = Math.sqrt(Math.pow(x - controlPointX2, 2) + Math.pow(y - targetAnchor.y, 2));
      return distToControl1 < tolerance || distToControl2 < tolerance;
    };

    const handleAddPoint = (e: React.MouseEvent<SVGPathElement, MouseEvent>, source: string, target: string) => {
      const pathElement = e.currentTarget;
      const svg = pathElement.ownerSVGElement!;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const totalLength = pathElement.getTotalLength();
      const step = 0.1;
      let closestPoint = { x: 0, y: 0, relativePosition: 0 };
      let minDistance = Infinity;

      for (let len = 0; len < totalLength; len += step) {
        const point = pathElement.getPointAtLength(len);
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = { x: point.x, y: point.y, relativePosition: len / totalLength };
        }
      }

      if (minDistance < 20) {
        setPoints((prevPoints) => [...prevPoints, { x: closestPoint.x, y: closestPoint.y, source, target, id: Date.now(), relativePosition: closestPoint.relativePosition }]);
      }
    };

    const renderPoints = () => {
      // Filter points associated with this connection
      const connectionPoints = points.filter(point => point.source === sourceNodeId && point.target === targetNodeId);
      return connectionPoints.map((point) => (
        <g key={point.id}>
          {hoveredPointId === `${sourceNodeId}-${targetNodeId}-${point.id}` && (
            <SmoothCircle
              cx={point.x}
              cy={point.y}
              r={9}
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={0.5}
            />
          )}
          <SmoothCircle
            cx={point.x}
            cy={point.y}
            r={3}
            fill="hsl(var(--muted-foreground))"
          />
          <SmoothCircle
            cx={point.x}
            cy={point.y}
            r={12}
            fill="transparent"
            onClick={() => {
              setPoints((prevPoints) => prevPoints.filter((p) => p.id !== point.id));
            }}
            onMouseEnter={() => setHoveredPointId(`${sourceNodeId}-${targetNodeId}-${point.id}`)}
            onMouseLeave={() => setHoveredPointId(null)}
          />
        </g>
      ));
    };

    return (
      <g key={key}>
        <path
          d={path}
          stroke="transparent"
          strokeWidth="20"
          fill="none"
          pointerEvents="stroke"
          onMouseEnter={(e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
            /* Debug logging removed */
          }}
          onClick={(e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
            handleAddPoint(e, sourceNodeId, targetNodeId);
          }}
          style={{ cursor: 'pointer' }}
        />
        <path
          d={path}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          pointerEvents="stroke"
          style={{ cursor: 'pointer' }}
          onClick={(e: React.MouseEvent<SVGPathElement, MouseEvent>) => handleAddPoint(e, sourceNodeId, targetNodeId)}
        />
        {renderPoints()}
      </g>
    );
  };

  // Replace the return of the component to render a single SVG container
  return (
    <svg
      className="absolute"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%', 
        height: '100%',
        zIndex: 0,
        overflow: 'visible',
        pointerEvents: 'auto'
      }}
    >
      {stableConnections.map(connection => 
        renderConnectionGroup(connection.source, connection.target, `${connection.source}-${connection.target}`)
      )}
    </svg>
  );
} 