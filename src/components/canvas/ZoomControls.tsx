'use client';

import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';
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
 * Provides UI controls for zooming and centering the canvas view.
 * Displays the current zoom level and allows for zoom in/out and reset actions.
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
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      {/* Control panel container with glass effect */}
      <div className="bg-card/90 backdrop-blur-sm rounded-lg shadow-lg border border-border p-3 flex flex-col gap-3">
        {/* Zoom level display */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Zoom</span>
          <span className="text-xs bg-background/50 px-2 py-0.5 rounded-full">
            {Math.round(displayScale * 100)}%
          </span>
        </div>
        
        {/* Zoom slider with buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom out button */}
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={onZoomOut}
            className="h-8 w-8 rounded-l-md"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          {/* Zoom level indicator bar */}
          <div className="h-1 bg-muted rounded-full flex-grow">
            <div 
              className="h-full bg-border rounded-full" 
              style={{ 
                // Calculate width based on zoom level (0.2 to 3.0 range)
                width: `${Math.max(0, Math.min(100, (displayScale - 0.2) / 2.8 * 100))}%` 
              }}
            />
          </div>
          
          {/* Zoom in button */}
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={onZoomIn}
            className="h-8 w-8 rounded-r-md"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Center view button - resets the view to center on active node */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReset}
          className="w-full text-xs gap-1 h-8 border-border hover:bg-muted"
          title="Center Active Node"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Center View</span>
        </Button>
      </div>
    </div>
  );
} 