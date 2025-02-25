'use client';

import { useState, useEffect, useMemo } from 'react';

interface InfiniteGridProps {
  scale: number; // We'll ignore this parameter in the new implementation
  position: { x: number; y: number };
}

/**
 * InfiniteGrid Component
 * Renders a static, infinite grid of dots that doesn't scale when the canvas is zoomed
 * The grid is implemented as a fixed background pattern that only translates
 */
export default function InfiniteGrid({ position }: InfiniteGridProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);
  
  // Update dimensions and set mounted flag on client side
  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    setMounted(true);
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Don't render anything during SSR or before client-side hydration
  if (!mounted) {
    return null;
  }
  
  // Fixed grid size
  const gridSize = 40;
  
  // Calculate the background position based on the current pan position
  // We use modulo to keep the pattern repeating correctly
  const offsetX = position.x % gridSize;
  const offsetY = position.y % gridSize;
  
  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(128, 128, 128, 0.15) 2px, transparent 2px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
} 