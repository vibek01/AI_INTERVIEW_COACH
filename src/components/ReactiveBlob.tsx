// src/components/ReactiveBlob.tsx
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

// ✨ CHANGE: Update interface to include $isSpeaking
interface ReactiveBlobProps {
  $baseSize?: number;
  $baseAnimationTime?: number;
  $userVolume?: number;
  $isThinking?: boolean;
  $isSpeaking?: boolean;
}

// ✨ CHANGE: Update function signature
export function ReactiveBlob({ $baseSize = 1, $baseAnimationTime = 2, $userVolume = 0, $isThinking = false, $isSpeaking = false }: ReactiveBlobProps) {
  const { mode } = useTheme();

  const colors = mode === 'dark' ? {
    one: '#60A5FA', two: '#22D3EE', three: 'rgba(96, 165, 250, 0.5)',
    four: 'rgba(34, 211, 238, 0.5)', five: 'rgba(96, 165, 250, 0.2)',
  } : {
    one: '#3B82F6', two: '#06B6D4', three: 'rgba(59, 130, 246, 0.5)',
    four: 'rgba(6, 182, 212, 0.5)', five: 'rgba(59, 130, 246, 0.2)',
  };

  return (
    // ✨ CHANGE: Pass the new prop down
    <StyledWrapper 
      $baseSize={$baseSize} 
      $baseAnimationTime={$baseAnimationTime} 
      $colors={colors}
      $userVolume={$userVolume}
      $isThinking={$isThinking}
      $isSpeaking={$isSpeaking}
    >
      <div className="loader">
        <svg width={100} height={100} viewBox="0 0 100 100">
          {/* ... SVG defs (no changes) ... */}
        </svg>
        <div className="box" />
      </div>
    </StyledWrapper>
  );
}

// ✨ ADDED: Keyframes are now defined at the top level for performance.
const thinkingPulse = keyframes` 0%, 100% { filter: contrast(15); } 50% { filter: contrast(10); } `;
const speakingPulse = keyframes` 0%, 100% { filter: contrast(12); } 50% { filter: contrast(20); } `;
const roundness = keyframes` 0%, 100% { filter: contrast(15); } 20%, 40% { filter: contrast(3); } 60% { filter: contrast(15); } `;
const colorize = keyframes` 0%, 100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(-45deg); } `;
const rotation = keyframes` 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } `;


// ✨ CHANGE: Update styled-component type and logic
const StyledWrapper = styled.div<{ $baseSize: number; $baseAnimationTime: number; $colors: any; $userVolume: number; $isThinking: boolean; $isSpeaking: boolean; }>`
  .loader {
    --color-one: ${props => props.$colors.one};
    --color-two: ${props => props.$colors.two};
    --color-three: ${props => props.$colors.three};
    --color-four: ${props => props.$colors.four};
    --color-five: ${props => props.$colors.five};
    
    --base-size: ${props => props.$baseSize};
    --voice-pulse-scale: 1; /* Removed userVolume logic */
    --base-animation-time: ${props => props.$baseAnimationTime}s;
    --dynamic-animation-time: var(--base-animation-time); /* Removed userVolume logic */
    --shadow-spread: 25px; /* Removed userVolume logic */

    position: relative;
    border-radius: 50%;
    
    transform: scale(var(--base-size));
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;

    box-shadow: 0 0 var(--shadow-spread) 0 var(--color-three), 0 20px 50px 0 var(--color-four);
    animation: ${colorize} calc(var(--base-animation-time) * 3) ease-in-out infinite;
  }
  
  .loader::before { content: ""; position: absolute; top: 0; left: 0; width: 100px; height: 100px; border-radius: 50%; border-top: solid 1px var(--color-one); border-bottom: solid 1px var(--color-two); background: linear-gradient(180deg, var(--color-five), var(--color-four)); box-shadow: inset 0 10px 10px 0 var(--color-three), inset 0 -10px 10px 0 var(--color-four); }
  .loader .box { width: 100px; height: 100px; background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%); mask: url(#clipping); -webkit-mask: url(#clipping); }
  .loader svg { position: absolute; }

  .loader svg #clipping {
    filter: contrast(15);
    // ✨ CHANGE: This is the core animation logic. It prioritizes speaking, then thinking.
    animation: ${props => 
      props.$isSpeaking 
        ? css`${speakingPulse} calc(var(--dynamic-animation-time) / 1.5) linear infinite` 
      : props.$isThinking 
        ? css`${thinkingPulse} var(--dynamic-animation-time) linear infinite` 
        : css`${roundness} calc(var(--dynamic-animation-time) / 2) linear infinite`
    };
  }

  .loader svg #clipping polygon { filter: blur(7px); }
  .loader svg #clipping polygon:nth-child(2) { animation: ${rotation} var(--dynamic-animation-time) linear infinite reverse; }
  .loader svg #clipping polygon:nth-child(3) { animation: ${rotation} var(--dynamic-animation-time) linear infinite; animation-delay: calc(var(--dynamic-animation-time) / -3); }
  /* ... other polygon styles (no changes) ... */
`;