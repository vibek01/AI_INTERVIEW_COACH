import { useMemo } from 'react';
import { ReactiveBlob } from './ReactiveBlob';

interface AIAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  userVolume: number; // New prop for live user microphone volume (0 to 1)
}

export function AIAvatar({ isListening, isSpeaking, userVolume }: AIAvatarProps) {
  
  const blobState = useMemo(() => {
    // When the AI is speaking, it should be dominant and not react to user's voice
    if (isSpeaking) {
      return { size: 1.6, animationTime: 1 };
    }
    
    // When the AI is listening, it should react to the user's voice
    if (isListening) {
      // Base size when listening
      const baseSize = 1.5;
      // Additional size based on how loud the user is.
      // The multiplier (e.g., 0.8) controls sensitivity.
      const dynamicSize = baseSize + (userVolume * 0.8);
      
      // Make the animation faster when the user is speaking
      const dynamicAnimationTime = 4 - (userVolume * 3);

      return { size: dynamicSize, animationTime: dynamicAnimationTime };
    }
    
    // Default idle state
    return { size: 1.4, animationTime: 3 };
  }, [isSpeaking, isListening, userVolume]);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <ReactiveBlob 
        size={blobState.size} 
        animationTime={blobState.animationTime} 
      />
    </div>
  );
}