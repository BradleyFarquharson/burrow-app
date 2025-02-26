'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Node, Branch, GeminiResponse, Connection } from '@/types';
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
        content: branch.title || 'Explore this idea',
        description: branch.description || 'No description available',
        type: 'branch' as const,
        position: calculatePosition(parentId || 'explore', index, data.branches.length),
        width: 240, // w-60 = 15rem = 240px at default font size
        height: 128, // Approximate height for branch nodes
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
          content: 'Try again',
          description: 'Sometimes the AI needs another attempt',
          type: 'branch' as const,
          position: calculatePosition(parentId || 'explore', 0, 3),
          width: 240,
          height: 128,
        },
        {
          id: uuidv4(),
          content: 'Rephrase your question',
          description: 'Try asking in a different way',
          type: 'branch' as const,
          position: calculatePosition(parentId || 'explore', 1, 3),
          width: 240,
          height: 128,
        },
        {
          id: uuidv4(),
          content: 'Check your connection',
          description: 'Make sure you have internet access',
          type: 'branch' as const,
          position: calculatePosition(parentId || 'explore', 2, 3),
          width: 240,
          height: 128,
        },
      ];
      
      return { 
        answer: "Sorry, I couldn't generate ideas at this time. Please try again or rephrase your question.", 
        branches: fallbackBranches
      };
    }
  };

  const calculatePosition = (parentId: string, index: number, total: number) => {
    // Return a default position that allows subnodes to be placed anywhere
    return {
      x: Math.random() * 1000, // Random x position for testing
      y: Math.random() * 1000, // Random y position for testing
    };
  };

  return { generateIdeas, isLoading };
} 