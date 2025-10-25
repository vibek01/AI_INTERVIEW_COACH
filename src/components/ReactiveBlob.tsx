import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

interface ReactiveBlobProps {
  baseSize?: number;
  baseAnimationTime?: number;
  userVolume?: number;
}

export function ReactiveBlob({ baseSize = 1, baseAnimationTime = 2, userVolume = 0 }: ReactiveBlobProps) {
  const { mode } = useTheme();

  const colors = mode === 'dark' ? {
    one: '#60A5FA', two: '#22D3EE', three: 'rgba(96, 165, 250, 0.5)',
    four: 'rgba(34, 211, 238, 0.5)', five: 'rgba(96, 165, 250, 0.2)',
  } : {
    one: '#3B82F6', two: '#06B6D4', three: 'rgba(59, 130, 246, 0.5)',
    four: 'rgba(6, 182, 212, 0.5)', five: 'rgba(59, 130, 246, 0.2)',
  };

  return (
    <StyledWrapper 
      baseSize={baseSize} 
      baseAnimationTime={baseAnimationTime} 
      colors={colors}
      userVolume={userVolume}
    >
      <div className="loader">
        <svg width={100} height={100} viewBox="0 0 100 100">
          <defs>
            <mask id="clipping">
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
          </defs>
        </svg>
        <div className="box" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ baseSize: number; baseAnimationTime: number; colors: any; userVolume: number; }>`
  .loader {
    --color-one: ${props => props.colors.one};
    --color-two: ${props => props.colors.two};
    --color-three: ${props => props.colors.three};
    --color-four: ${props => props.colors.four};
    --color-five: ${props => props.colors.five};
    
    // --- CORE FIX AREA ---

    // 1. DYNAMIC SCALING (Shrink & Expand)
    --base-size: ${props => props.baseSize};
    // The orb now shrinks to 85% of its base size at silence (0 volume)
    // and expands up to 150% of its base size at max volume (1.0).
    // The total range of motion is 65% (1.50 - 0.85).
    --voice-pulse-scale: ${props => 0.85 + (props.userVolume * 0.65)};

    // 2. DYNAMIC ANIMATION SPEED (Inner Wobble)
    --base-animation-time: ${props => props.baseAnimationTime}s;
    // At silence, animation is the full base time. At max volume, it becomes much faster.
    // Example: Base time 4s. At max volume, it becomes 4 - (1 * 3) = 1s.
    --dynamic-animation-time: calc(var(--base-animation-time) - (${props => props.userVolume} * (var(--base-animation-time) * 0.75)));

    // 3. DYNAMIC GLOW
    --shadow-spread: ${props => 25 + (props.userVolume * 40)}px;

    position: relative;
    border-radius: 50%;
    
    transform: scale(calc(var(--base-size) * var(--voice-pulse-scale)));
    transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;

    box-shadow:
      0 0 var(--shadow-spread) 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
      
    animation: colorize calc(var(--base-animation-time) * 3) ease-in-out infinite;
  }

  .loader::before {
    content: ""; position: absolute; top: 0; left: 0; width: 100px; height: 100px;
    border-radius: 50%; border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two); background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow: inset 0 10px 10px 0 var(--color-three), inset 0 -10px 10px 0 var(--color-four);
  }

  .loader .box {
    width: 100px; height: 100px; background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
    mask: url(#clipping); -webkit-mask: url(#clipping);
  }

  .loader svg { position: absolute; }

  // Apply the dynamic animation time to the key internal animations
  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--dynamic-animation-time) / 2) linear infinite;
  }

  .loader svg #clipping polygon { filter: blur(7px); }
  .loader svg #clipping polygon:nth-child(1) { transform-origin: 75% 25%; transform: rotate(90deg); }
  .loader svg #clipping polygon:nth-child(2) { transform-origin: 50% 50%; animation: rotation var(--dynamic-animation-time) linear infinite reverse; }
  .loader svg #clipping polygon:nth-child(3) { transform-origin: 50% 60%; animation: rotation var(--dynamic-animation-time) linear infinite; animation-delay: calc(var(--dynamic-animation-time) / -3); }
  .loader svg #clipping polygon:nth-child(4) { transform-origin: 40% 40%; animation: rotation var(--dynamic-animation-time) linear infinite reverse; }
  .loader svg #clipping polygon:nth-child(5) { transform-origin: 40% 40%; animation: rotation var(--dynamic-animation-time) linear infinite reverse; animation-delay: calc(var(--dynamic-animation-time) / -2); }
  .loader svg #clipping polygon:nth-child(6) { transform-origin: 60% 40%; animation: rotation var(--dynamic-animation-time) linear infinite; }
  .loader svg #clipping polygon:nth-child(7) { transform-origin: 60% 40%; animation: rotation var(--dynamic-animation-time) linear infinite; animation-delay: calc(var(--dynamic-animation-time) / -1.5); }

  @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes roundness { 0%, 100% { filter: contrast(15); } 20%, 40% { filter: contrast(3); } 60% { filter: contrast(15); } }
  @keyframes colorize { 0%, 100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(-45deg); } }
`;