'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Node, Branch, GeminiResponse } from '@/types';
import { useExplorationStore } from '@/store/explorationStore';

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);

  const generateIdeas = async (question: string, parentId?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: question }),
      });

      const data = await response.json() as GeminiResponse;
      
      // Create branch nodes from suggestions
      const branches = data.branches.map((branch: Branch, index: number) => ({
        id: uuidv4(),
        content: branch.title,
        description: branch.description,
        type: 'branch' as const,
        position: calculatePosition(parentId || 'explore', index, data.branches.length),
      }));

      setIsLoading(false);
      return { answer: data.answer, branches };
    } catch (error) {
      console.error('Error generating ideas:', error);
      setIsLoading(false);
      return { 
        answer: "Sorry, I couldn't generate ideas at this time.", 
        branches: [] 
      };
    }
  };

  // Helper function to position nodes in a circular pattern around the parent node
  const calculatePosition = (parentId: string, index: number, total: number) => {
    const radius = 250; // Distance from parent node
    const angle = (index / total) * 2 * Math.PI;
    
    // Get the parent node's position from the store
    const nodes = useExplorationStore.getState().nodes;
    const parentNode = nodes[parentId];
    
    // If we can't find the parent node, use a fallback position
    if (!parentNode) {
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    }
    
    // Position relative to the parent node
    return {
      x: parentNode.position.x + radius * Math.cos(angle),
      y: parentNode.position.y + radius * Math.sin(angle),
    };
  };

  return { generateIdeas, isLoading };
} 