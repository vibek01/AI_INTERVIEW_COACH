// src/services/aiService.ts

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

const YOUR_SITE_URL = import.meta.env.VITE_YOUR_SITE_URL || 'http://localhost:5173';
const YOUR_SITE_NAME = import.meta.env.VITE_YOUR_SITE_NAME || 'AI Interview Coach';

const AI_MODEL = "z-ai/glm-4.5-air:free";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Adam

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * ✨ FIX: Unlocks audio context on mobile (must be called in a user gesture).
 */
export function unlockAudio(): void {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (context.state === "suspended") {
      context.resume();
    }
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    console.log("✅ Audio unlocked for mobile playback.");
  } catch (err) {
    console.warn("Failed to unlock audio context:", err);
  }
}

export async function getAIResponse(chatHistory: ChatMessage[]): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error("Missing OpenRouter API key");
  console.log("🧠 Sending to OpenRouter:", chatHistory[chatHistory.length - 1]?.content);
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
        model: AI_MODEL,
        messages: chatHistory,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter failed: ${response.status} ${errBody}`);
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content || "";
    console.log("✅ Got AI response:", aiText.slice(0, 60) + "...");
    return aiText.trim() || "Sorry, I couldn't think of a response.";
  } catch (err) {
    console.error("🔥 OpenRouter request failed:", err);
    return "Sorry, I ran into an issue generating my response.";
  }
}

export async function speakText(text: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) throw new Error("Missing ElevenLabs API key");
  if (!text) throw new Error("speakText received empty text");

  console.log("🔊 Requesting TTS for:", text.slice(0, 80), "...");

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs error: ${response.status} - ${err}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("🔥 TTS request failed:", err);
    throw err;
  }
}