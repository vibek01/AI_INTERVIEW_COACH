// src/components/AIAvatar.tsx
import { useMemo } from 'react';
import { ReactiveBlob } from './ReactiveBlob'; 

interface AIAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;      // AI is speaking
  isThinking: boolean;
  isGenerating: boolean;
  userIsSpeaking: boolean;  // ✨ ADDED: User is speaking
  userVolume: number;
}

export function AIAvatar({ isListening, isSpeaking, isThinking, isGenerating, userIsSpeaking }: AIAvatarProps) {
  
  const blobState = useMemo(() => {
    // ✨ CHANGE: The orb is most active when either the AI or the user is speaking.
    if (isSpeaking || userIsSpeaking) {
      return { baseSize: 1.6, baseAnimationTime: 1.2 };
    }
    if (isThinking || isGenerating) {
      return { baseSize: 1.4, baseAnimationTime: 0.8 };
    }
    if (isListening) {
      return { baseSize: 1.5, baseAnimationTime: 4 };
    }
    return { baseSize: 1.3, baseAnimationTime: 3 }; // Idle state
  }, [isSpeaking, isListening, isThinking, isGenerating, userIsSpeaking]);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <ReactiveBlob 
        $baseSize={blobState.baseSize} 
        $baseAnimationTime={blobState.baseAnimationTime}
        $userVolume={0} // This remains 0
        $isThinking={isThinking || isGenerating}
        // ✨ CHANGE: Pass a single boolean to trigger the speaking animation
        $isSpeaking={isSpeaking || userIsSpeaking}
      />
    </div>
  );
}