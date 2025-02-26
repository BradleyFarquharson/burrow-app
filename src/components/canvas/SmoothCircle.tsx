import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SmoothCircleProps {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  onClick?: (e: React.MouseEvent<SVGCircleElement, MouseEvent>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SmoothCircle: React.FC<SmoothCircleProps> = ({
  cx,
  cy,
  r,
  fill,
  stroke = 'none',
  strokeWidth = 0,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const ref = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      d3.select(ref.current)
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', r)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', strokeWidth);
    }
  }, [cx, cy, r, fill, stroke, strokeWidth]);

  return (
    <circle
      ref={ref}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};

export default SmoothCircle; 