'use client';
import Canvas from '@/components/Canvas';
import ChatHistory from '@/components/ChatHistory';
import { useExplorationStore } from '@/store/explorationStore';

export default function Home() {
  const { nodes } = useExplorationStore();
  
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Chat history panel */}
      <ChatHistory />
      
      {/* Main canvas area */}
      <div className="flex-grow relative">
        <Canvas />
      </div>
    </main>
  );
}
