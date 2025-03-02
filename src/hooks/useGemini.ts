'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Node, Branch } from '@/types';
import { useExplorationStore } from '@/store/explorationStore';
import { DEFAULT_NODE_SIZE } from '@/config/nodeConfig';

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    currentExplorationId,
    explorations,
    updateNodeContent,
    updateNodeQuestion,
    addBranchNodes,
    updateExplorationTitle
  } = useExplorationStore();

  const generateIdeas = async (question: string, parentId?: string) => {
    setIsLoading(true);
    console.log(`Sending question to Gemini API: "${question}"`);

    try {
      // Call the API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: question }),
      });

      // Check if the response is OK
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received data from Gemini API:', data);

      // Validate the response structure
      if (!data || !data.answer || !Array.isArray(data.branches)) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from API');
      }

      // Update the current node if provided
      if (parentId) {
        // Update the node's content
        updateNodeContent(parentId, data.answer);
        updateNodeQuestion(parentId, question);

        // Create branch nodes
        const branches = data.branches.map((branch: Branch) => ({
          id: uuidv4(),
          title: branch.title,
          content: branch.description,
          type: 'branch' as const,
          position: { x: 0, y: 0 },
          size: DEFAULT_NODE_SIZE,
        }));

        // Add the branch nodes to the exploration
        addBranchNodes(parentId, branches);

        // Update exploration title if this is the first node
        if (currentExplorationId) {
          const exploration = explorations[currentExplorationId];
          const nodeCount = Object.keys(exploration.nodes).length;
          if (nodeCount <= 1) {
            updateExplorationTitle(currentExplorationId, 
              question.length > 60 ? `${question.substring(0, 57)}...` : question
            );
          }
        }
      }

      setIsLoading(false);
      return { answer: data.answer, branches: data.branches };
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
          position: { x: 0, y: 0 },
          size: DEFAULT_NODE_SIZE,
        },
        {
          id: uuidv4(),
          title: 'Rephrase your question',
          content: 'Try asking in a different way',
          type: 'branch' as const,
          position: { x: 0, y: 0 },
          size: DEFAULT_NODE_SIZE,
        },
      ];
      
      return { 
        answer: "Sorry, I couldn't generate ideas at this time. Please try again or rephrase your question.", 
        branches: fallbackBranches
      };
    }
  };

  return { generateIdeas, isLoading };
} 