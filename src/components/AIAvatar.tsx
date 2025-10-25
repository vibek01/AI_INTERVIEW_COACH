import { useMemo } from 'react';
import { ReactiveBlob } from './ReactiveBlob';

interface AIAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  userVolume: number;
}

export function AIAvatar({ isListening, isSpeaking, userVolume }: AIAvatarProps) {
  
  const blobState = useMemo(() => {
    // State for when AI is speaking (large and active)
    if (isSpeaking) {
      return { baseSize: 1.6, baseAnimationTime: 1.2 };
    }
    // State for when AI is listening (ready to pulse)
    if (isListening) {
      // The base size is now the midpoint of the pulse
      return { baseSize: 1.5, baseAnimationTime: 4 };
    }
    // Default idle state (calm and smaller)
    return { baseSize: 1.3, baseAnimationTime: 3 };
  }, [isSpeaking, isListening]);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <ReactiveBlob 
        baseSize={blobState.baseSize} 
        baseAnimationTime={blobState.baseAnimationTime}
        // Pass user volume down ONLY when the AI is listening
        userVolume={isListening ? userVolume : 0}
      />
    </div>
  );
}