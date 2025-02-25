'use client';

import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the ZoomControls component
 */
interface ZoomControlsProps {
  /** Current zoom scale to display */
  displayScale: number;
  /** Handler for zoom in button click */
  onZoomIn: () => void;
  /** Handler for zoom out button click */
  onZoomOut: () => void;
  /** Handler for reset view button click */
  onReset: () => void;
}

/**
 * ZoomControls Component
 * 
 * Provides simple pill-shaped UI controls for zooming and resetting the canvas view.
 * 
 * @param props - Component props
 * @returns React component that renders zoom controls
 */
export default function ZoomControls({
  displayScale,
  onZoomIn,
  onZoomOut,
  onReset
}: ZoomControlsProps): React.ReactElement {
  return (
    <div className="bg-card/90 backdrop-blur-sm rounded-lg shadow-lg border border-border flex items-center active">
      {/* Zoom out button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onZoomOut}
        className="h-9 w-9 rounded-md active"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      {/* Zoom level display */}
      <div className="px-2 text-xs font-medium active">
        {Math.round(displayScale * 100)}%
      </div>
      
      {/* Zoom in button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onZoomIn}
        className="h-9 w-9 rounded-md active"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      {/* Divider */}
      <div className="h-5 w-px bg-border mx-1"></div>
      
      {/* Reset view button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onReset}
        className="h-9 w-9 rounded-md active"
        title="Reset View"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
} 