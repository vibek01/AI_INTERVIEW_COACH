import { useMemo } from 'react';
import { ReactiveBlob } from './ReactiveBlob';

interface AIAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  userVolume: number;
}

export function AIAvatar({ isListening, isSpeaking, userVolume }: AIAvatarProps) {
  
  const blobState = useMemo(() => {
    if (isSpeaking) {
      return { size: 1.6, animationTime: 1.2 };
    }
    if (isListening) {
      // The base size is now slightly smaller to make room for the pulse effect
      return { size: 1.4, animationTime: 4 };
    }
    return { size: 1.3, animationTime: 3 };
  }, [isSpeaking, isListening]);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <ReactiveBlob 
        size={blobState.size} 
        animationTime={blobState.animationTime}
        // Pass the user's voice volume down, but only when the AI is in a listening state.
        // When the AI is speaking, the user's voice should not affect the orb.
        userVolume={isListening ? userVolume : 0}
      />
    </div>
  );
}