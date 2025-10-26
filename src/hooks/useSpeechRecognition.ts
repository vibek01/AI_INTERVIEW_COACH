// src/hooks/useSpeechRecognition.ts
import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  userIsSpeaking: boolean; // ✨ ADDED: New state to track user speech
}

/**
 * Custom hook for speech recognition.
 * Now tracks when the user is actively speaking.
 */
export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userIsSpeaking, setUserIsSpeaking] = useState(false); // ✨ ADDED: State for the new feature

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition API is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      console.log("🎙️ Speech recognition started");
    };

    // ✨ ADDED: Event listener for when speech is detected
    recognition.onspeechstart = () => {
      setUserIsSpeaking(true);
      console.log("🗣️ User started speaking");
    };

    // ✨ ADDED: Event listener for when speech ends
    recognition.onspeechend = () => {
      setUserIsSpeaking(false);
      console.log("🤫 User stopped speaking");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      isListeningRef.current = false;
      recognition.stop(); // auto-stop after result
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setError(event.error);
      setIsListening(false);
      setUserIsSpeaking(false); // Reset on error
    };

    recognition.onend = () => {
      console.log("⚠️ SpeechRecognition ended automatically");
      setIsListening(false);
      setUserIsSpeaking(false); // Reset on end

      // Auto-restart if still supposed to listen
      if (isListeningRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            console.log("🔁 Restarted SpeechRecognition");
          } catch (e) {
            console.warn("Failed to restart recognition:", e);
          }
        }, 600); // small delay for mobile
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    isListeningRef.current = true;
    setTranscript("");
    try {
      recognitionRef.current.start();
      console.log("🎧 Listening started");
    } catch (e) {
      console.warn("SpeechRecognition start failed:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = false;
    recognitionRef.current.stop();
  }, []);

  // ✨ ADDED: Return the new state
  return { isListening, transcript, startListening, stopListening, error, userIsSpeaking };
}