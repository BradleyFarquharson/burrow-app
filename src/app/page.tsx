'use client';

import Canvas from '@/components/Canvas';
import SidePanel from '@/components/SidePanel';
import { useExplorationStore } from '@/store/explorationStore';

export default function Home() {
  const { nodes } = useExplorationStore();
  
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Side panel with exploration history and settings */}
      <SidePanel />
      
      {/* Main canvas area */}
      <div className="flex-grow relative">
        <Canvas />
      </div>
    </main>
  );
}
