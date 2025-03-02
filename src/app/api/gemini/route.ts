import { NextRequest, NextResponse } from 'next/server';

// Gemini API configuration
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Fallback response for when things go wrong
const FALLBACK_RESPONSE = {
  answer: "I'm having trouble processing your request right now. Please try again later.",
  branches: [
    { title: "Try again", description: "The AI service may work on another attempt." },
    { title: "Rephrase your question", description: "Sometimes asking differently yields better results." },
    { title: "Check your connection", description: "Make sure you have a stable internet connection." },
    { title: "Simplify your query", description: "Try asking a more straightforward question." },
    { title: "Wait and retry", description: "The service might be temporarily overloaded." }
  ]
};

export async function POST(request: NextRequest) {
  try {
    // Extract prompt from request
    const { prompt } = await request.json();
    
    // Check if API key is set
    if (!API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        {
          answer: "API key not configured. Please check server configuration.",
          branches: FALLBACK_RESPONSE.branches
        },
        { status: 200 }
      );
    }
    
    console.log(`Using API key: ${API_KEY.substring(0, 3)}...${API_KEY.substring(API_KEY.length - 3)} (length: ${API_KEY.length})`);
    
    // Prepare the prompt with instructions
    const promptText = `
      Answer this question: "${prompt}"
      
      Respond with a JSON object that has:
      1. An "answer" field with 2-4 sentences directly answering the question
      2. A "branches" array with 5 objects, each having a "title" (3-6 words) and "description" (1-2 sentences)
      
      Example format:
      {
        "answer": "Your answer here spanning 2-4 sentences.",
        "branches": [
          { "title": "First Related Topic", "description": "Brief explanation of this related topic." },
          { "title": "Second Related Topic", "description": "Brief explanation of another related aspect." }
        ]
      }
    `;
    
    // Call Gemini API with the correct request format
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });
    
    // If API call failed, return fallback
    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
    }
    
    // Parse API response
    const data = await response.json();
    console.log('Received response from Gemini API');
    
    // Extract text content
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      console.error('No text content in Gemini response');
      return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
    }
    
    console.log('Extracted text content from response');
    
    // Try to extract JSON from response
    try {
      // Find JSON in response (handle both code blocks and direct JSON)
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        textContent.match(/{[\s\S]*}/);
                      
      if (!jsonMatch) {
        console.error('No JSON found in response');
        return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
      }
      
      // Clean and parse JSON
      const jsonString = (jsonMatch[1] || jsonMatch[0])
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/\n/g, ' ')           // Remove newlines
        .replace(/\s+/g, ' ');         // Normalize whitespace
      
      console.log('Attempting to parse JSON:', jsonString.substring(0, 50) + '...');
      const parsedData = JSON.parse(jsonString);
      
      // Validate structure
      if (!parsedData.answer || !Array.isArray(parsedData.branches)) {
        console.error('Invalid parsed data structure');
        return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
      }
      
      // Ensure we have exactly 5 branches
      while (parsedData.branches.length < 5) {
        parsedData.branches.push(FALLBACK_RESPONSE.branches[parsedData.branches.length % FALLBACK_RESPONSE.branches.length]);
      }
      
      if (parsedData.branches.length > 5) {
        parsedData.branches = parsedData.branches.slice(0, 5);
      }
      
      console.log('Successfully processed Gemini response');
      return NextResponse.json(parsedData, { status: 200 });
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
  }
} 