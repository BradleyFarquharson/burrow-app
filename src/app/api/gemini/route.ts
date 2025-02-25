import { NextRequest, NextResponse } from 'next/server';

// You'll need to get your API key from Google AI Studio
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    // Create the prompt for Gemini
    const promptText = `
    Based on this question or idea: "${prompt}"
    
    Provide:
    1. A concise answer (2-3 sentences)
    2. 3-5 interesting related branches to explore further
    
    Format your response as a JSON object:
    {
      "answer": "Your main answer here",
      "branches": [
        {
          "title": "First branch title",
          "description": "Brief description of this branch"
        },
        // more branches...
      ]
    }
    `;
    
    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText
              }
            ]
          }
        ]
      }),
    });
    
    const data = await response.json();
    
    // Parse the Gemini response - in a real app, add better error handling for parsing
    try {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || 
                        text.match(/{[\s\S]*}/);
                        
      const parsedData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      
      // Fallback with a basic response
      return NextResponse.json({
        answer: "I processed your question but couldn't format a proper response.",
        branches: [
          { 
            title: "Try again", 
            description: "Sometimes the AI needs a second attempt" 
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate ideas',
      },
      { status: 500 }
    );
  }
} 