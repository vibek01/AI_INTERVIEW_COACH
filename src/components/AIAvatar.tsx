import { useMemo } from 'react';
import { ReactiveBlob } from './ReactiveBlob';

interface AIAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export function AIAvatar({ isListening, isSpeaking }: AIAvatarProps) {
  
  // useMemo will calculate the blob's properties only when the state changes.
  const blobState = useMemo(() => {
    if (isSpeaking) {
      return { size: 1.6, animationTime: 1 }; // Fast and large when speaking
    }
    if (isListening) {
      return { size: 1.5, animationTime: 4 }; // Slower and pulsing when listening
    }
    return { size: 1.4, animationTime: 3 }; // Default idle state
  }, [isSpeaking, isListening]);

  return (
    // The container ensures the blob is centered and has a fixed size area.
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <ReactiveBlob 
        size={blobState.size} 
        animationTime={blobState.animationTime} 
      />
    </div>
  );
}