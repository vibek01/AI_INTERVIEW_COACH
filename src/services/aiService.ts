// src/services/aiService.ts

// --- API & MODEL CONFIGURATION ---
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

const YOUR_SITE_URL = import.meta.env.VITE_YOUR_SITE_URL || 'http://localhost:5173';
const YOUR_SITE_NAME = import.meta.env.VITE_YOUR_SITE_NAME || 'AI Interview Coach';

// ✨ FIX: Using the new, requested model
const AI_MODEL = "z-ai/glm-4.5-air:free";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Adam

// Type definition for chat messages
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI BRAIN: Gets a response from OpenRouter
 */
export async function getAIResponse(chatHistory: ChatMessage[]): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured in .env.local");
  }

  // ✨ FIX: Added logging to see if the function is being called
  console.log("Attempting to get AI response with model:", AI_MODEL);
  console.log("Sending chat history:", chatHistory);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
      },
      body: JSON.stringify({
        "model": AI_MODEL,
        "messages": chatHistory,
      }),
    });

    if (!response.ok) {
      // ✨ FIX: More robust error logging to see the exact API error
      const errorBody = await response.text();
      console.error("OpenRouter API Error Response Body:", errorBody);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log("Received AI response:", data);
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, my brain is having a little trouble right now. Please check the browser console for detailed errors.";
  }
}

/**
 * AI VOICE: Fetches audio from ElevenLabs and returns an audio blob URL
 */
export async function speakText(text: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key is not configured in .env.local");
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("ElevenLabs API Error Response Body:", errorBody);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);

  } catch (error) {
    console.error("Error with ElevenLabs text-to-speech:", error);
    throw error; // Re-throw to be handled by the component
  }
}