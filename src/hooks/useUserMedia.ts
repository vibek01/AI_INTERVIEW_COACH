// src/hooks/useUserMedia.ts
import { useState, useEffect } from 'react';

export function useUserMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startMedia = async () => {
    setError(null);
    try {
      // This is the key fix: We ONLY request video.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      setStream(stream);
      return stream;
    } catch (err) {
      console.error("Error getting user media:", err);
      setError("Please allow camera and microphone permissions to start.");
      return null;
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return { stream, error, startMedia, stopMedia };
}