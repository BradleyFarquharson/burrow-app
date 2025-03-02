import { NextRequest, NextResponse } from 'next/server';

// Log API key details for debugging (without exposing the full key)
const API_KEY = process.env.GEMINI_API_KEY;
const API_KEY_LENGTH = API_KEY ? API_KEY.length : 0;
console.log(`GEMINI_API_KEY is ${API_KEY ? 'set' : 'NOT SET'} with length ${API_KEY_LENGTH}`);

// Updated to use gemini-2.0-flash model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!API_KEY) {
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
        { status: 200 } // Return 200 to gracefully handle on client
      );
    }
    
    // Create the prompt for Gemini
    const promptText = `
You will generate a structured response to the following question:
"${prompt}"

Requirements:

1. Comprehensive Answer  
- Write a concise yet detailed response (4-6 sentences).  
- Directly answer the core question.  
- Include rich context and explanations to enhance understanding.  

2. Five Key Subtopics  
Each subtopic must:  
- Have a clear, short title (5-8 words).  
- Provide a distinct, informative description (2-3 sentences).  
- Present new, relevant insights that build on the main answer.  
- Avoid restating the title in the description.  

3. JSON Output Format  
Ensure the response follows this structured format:  

{
  "answer": "Your complete response to the main question.",
  "branches": [
    {
      "title": "Subtopic Title (5-8 words)",
      "description": "A well-developed explanation providing context, importance, and implications of this subtopic."
    },
    {
      "title": "Another Subtopic Title",
      "description": "Detailed exploration of another key aspect that adds depth to the main answer."
    }
  ]
}

Example of a Strong Response:  

{
  "answer": "Apple processing involves strict quality control, from harvesting to packaging, ensuring food safety and freshness. Industry regulations dictate temperature management, chemical testing, and traceability systems to prevent contamination.",
  "branches": [
    {
      "title": "Modern Apple Processing Safety Standards",
      "description": "Strict food safety guidelines regulate temperature, sanitization, and contamination prevention. Continuous advancements in processing technology ensure compliance with health standards."
    },
    {
      "title": "Impact of Climate on Apple Yield",
      "description": "Weather conditions influence apple quality and harvest cycles. Farmers adapt using controlled environments and genetic modifications to optimize yield."
    }
  ]
}

Ensure clarity, depth, and relevance in all responses while maintaining this structured format.
`;
    
    // Call Gemini API with updated request format for gemini-2.0-flash
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
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
          maxOutputTokens: 2048,
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
          // Clean the JSON string by removing trailing commas
          const jsonString = (jsonMatch[1] || jsonMatch[0])
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/\n/g, ' ') // Remove newlines
            .replace(/\s+/g, ' '); // Normalize whitespace
          
          parsedData = JSON.parse(jsonString);
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

      // Validate we have all 5 branches
      if (parsedData.branches.length < 5) {
        console.error('Not enough branches generated:', parsedData.branches.length);
        // Add generic branches to make up the difference
        const genericBranches = [
          { title: "Additional Perspective", description: "Exploring another angle of this topic" },
          { title: "Further Implications", description: "Understanding the broader impact and consequences" },
          { title: "Related Concepts", description: "Examining connected ideas and principles" },
          { title: "Practical Applications", description: "Real-world uses and implementations" },
          { title: "Future Developments", description: "Potential evolution and upcoming changes" }
        ];

        while (parsedData.branches.length < 5) {
          parsedData.branches.push(genericBranches[parsedData.branches.length]);
        }
      }
      
      // Log the final response for debugging
      console.log('Final processed response:', JSON.stringify(parsedData, null, 2));
      
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