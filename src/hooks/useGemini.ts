'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Node, Branch, GeminiResponse, Connection } from '@/types';
import { useExplorationStore } from '@/store/explorationStore';
import { DEFAULT_NODE_SIZE } from '@/config/nodeConfig';

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

      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || !data.answer || !Array.isArray(data.branches)) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from API');
      }
      
      // Create branch nodes from suggestions
      const branches = (data.branches || []).map((branch: Branch, index: number) => ({
        id: uuidv4(),
        title: branch.title || 'Explore this idea',
        content: branch.description || 'No description available',
        type: 'branch' as const,
        position: calculatePosition(),
        size: DEFAULT_NODE_SIZE,
      }));

      setIsLoading(false);
      return { answer: data.answer, branches };
    } catch (error) {
      console.error('Error generating ideas:', error);
      setIsLoading(false);
      
      // Create fallback branches for error cases
      const fallbackBranches = [
        {
          id: uuidv4(),
          title: 'Try again',
          content: 'Sometimes the AI needs another attempt',
          type: 'branch' as const,
          position: calculatePosition(),
          size: DEFAULT_NODE_SIZE,
        },
        {
          id: uuidv4(),
          title: 'Rephrase your question',
          content: 'Try asking in a different way',
          type: 'branch' as const,
          position: calculatePosition(),
          size: DEFAULT_NODE_SIZE,
        },
        {
          id: uuidv4(),
          title: 'Check your connection',
          content: 'Make sure you have internet access',
          type: 'branch' as const,
          position: calculatePosition(),
          size: DEFAULT_NODE_SIZE,
        },
      ];
      
      return { 
        answer: "Sorry, I couldn't generate ideas at this time. Please try again or rephrase your question.", 
        branches: fallbackBranches
      };
    }
  };

  const calculatePosition = () => {
    return {
      x: 0,
      y: 0
    };
  };

  return { generateIdeas, isLoading };
} 