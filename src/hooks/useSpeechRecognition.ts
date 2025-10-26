// src/hooks/useSpeechRecognition.ts
import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

/**
 * Custom hook for speech recognition.
 * Handles mobile auto-stop and integrates with TTS flags.
 */
export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition API is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Mobile-friendly
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      console.log("🎙️ Speech recognition started");
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
    };

    recognition.onend = () => {
      console.log("⚠️ SpeechRecognition ended automatically");
      setIsListening(false);

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

  return { isListening, transcript, startListening, stopListening, error };
}
