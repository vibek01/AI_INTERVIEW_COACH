// src/components/AIAvatar.tsx
import { useMemo } from 'react';
import { ReactiveBlob } from './ReactiveBlob';

interface AIAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  userVolume: number; // This will now always be 0
}

export function AIAvatar({ isListening, isSpeaking, isThinking, userVolume }: AIAvatarProps) {
  
  const blobState = useMemo(() => {
  	if (isSpeaking) {
  	  return { baseSize: 1.6, baseAnimationTime: 1.2 };
  	}
  	if (isThinking) {
  	  return { baseSize: 1.4, baseAnimationTime: 0.8 };
  	}
  	if (isListening) {
  	  return { baseSize: 1.5, baseAnimationTime: 4 };
  	}
  	return { baseSize: 1.3, baseAnimationTime: 3 };
  }, [isSpeaking, isListening, isThinking]);

  return (
  	<div className="relative w-48 h-48 mx-auto flex items-center justify-center">
  	  {/* ✨ FIX: We remove the 'userVolume' logic completely. */}
  	  {/* It now only bases its animation on the AI's state. */}
  	  <ReactiveBlob 
  		$baseSize={blobState.baseSize} 
  		$baseAnimationTime={blobState.baseAnimationTime}
  		$userVolume={0} 
  		$isThinking={isThinking}
  	  />
  	</div>
  );
}