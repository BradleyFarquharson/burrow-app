import { NextRequest, NextResponse } from 'next/server';

// You'll need to get your API key from Google AI Studio
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Updated to use gemini-2.0-flash model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        {
          error: 'API key not configured',
          answer: "The Gemini API key is not configured. Please check your environment variables.",
          branches: [
            { 
              title: "Check API configuration", 
              description: "Make sure the GEMINI_API_KEY is set in your environment variables" 
            }
          ]
        },
        { status: 500 }
      );
    }
    
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
    
    // Call Gemini API with updated request format for gemini-2.0-flash
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: promptText
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Gemini API error:', response.status, errorData);
      return NextResponse.json(
        {
          answer: `Error from Gemini API: ${response.status} ${response.statusText}`,
          branches: [
            { 
              title: "Try again", 
              description: "The API might be temporarily unavailable" 
            }
          ]
        },
        { status: 200 } // Return 200 to handle gracefully on client
      );
    }
    
    const data = await response.json();
    
    // Log the full response for debugging
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    
    // Validate the response structure
    if (!data || !data.candidates || !data.candidates.length) {
      console.error('Invalid Gemini response structure:', data);
      return NextResponse.json({
        answer: "I received an unexpected response format from the AI service.",
        branches: [
          { 
            title: "Try a different question", 
            description: "Sometimes rephrasing can help get better results" 
          }
        ]
      });
    }
    
    // Parse the Gemini response with improved error handling
    try {
      // Safely access nested properties with optional chaining
      const text = data.candidates[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No text content in Gemini response');
      }
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || 
                        text.match(/{[\s\S]*}/);
      
      let parsedData;
      
      if (jsonMatch) {
        // Try to parse the JSON
        try {
          parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (jsonError) {
          console.error('Error parsing JSON from Gemini response:', jsonError);
          throw new Error('Invalid JSON format in response');
        }
      } else {
        // If no JSON found, try to extract meaningful content
        throw new Error('No JSON found in response');
      }
      
      // Validate the parsed data has the expected structure
      if (!parsedData.answer || !Array.isArray(parsedData.branches)) {
        console.error('Parsed data missing required fields:', parsedData);
        throw new Error('Response missing required fields');
      }
      
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      
      // Create a more informative fallback response
      return NextResponse.json({
        answer: "I processed your question but couldn't format a proper response.",
        branches: [
          { 
            title: "Try again", 
            description: "Sometimes the AI needs a second attempt" 
          },
          {
            title: "Rephrase your question",
            description: "Try asking in a different way"
          },
          {
            title: "Check API status",
            description: "The Gemini API might be experiencing issues"
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      {
        answer: "Sorry, there was an error processing your request.",
        branches: [
          { 
            title: "Try again later", 
            description: "The service might be temporarily unavailable" 
          }
        ]
      },
      { status: 200 } // Return 200 to handle gracefully on client
    );
  }
} 