import { useState, useEffect, useRef } from 'react';

// This hook analyzes the volume from a MediaStream (from the microphone)
export function useMicVolume(stream: MediaStream | null) {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If there's no stream, reset volume and do nothing
    if (!stream) {
      setVolume(0);
      return;
    }

    // Create an audio context and analyzer if they don't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
    }
    
    const audioContext = audioContextRef.current;
    const analyser = analyserRef.current;
    
    // Configure the analyzer
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Connect the stream to the analyzer
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // This function will be called repeatedly to measure the volume
    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (const amplitude of dataArray) {
        sum += amplitude * amplitude;
      }
      // Calculate the root mean square (RMS) to get a good volume reading
      const rms = Math.sqrt(sum / dataArray.length);
      // Normalize the volume to a 0-1 range for easier use in the UI
      const normalizedVolume = Math.min(rms / 128, 1);
      setVolume(normalizedVolume);
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    animationFrameRef.current = requestAnimationFrame(updateVolume);

    // This is the cleanup function that runs when the stream changes or component unmounts
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Disconnect the audio source to prevent memory leaks
      source.disconnect();
    };
  }, [stream]); // This effect re-runs only when the stream object itself changes

  return volume;
}