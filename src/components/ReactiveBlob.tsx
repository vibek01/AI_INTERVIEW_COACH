import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

interface ReactiveBlobProps {
  size?: number;
  animationTime?: number;
  userVolume?: number; // New prop for volume (0-1)
}

export function ReactiveBlob({ size = 1, animationTime = 2, userVolume = 0 }: ReactiveBlobProps) {
  const { mode } = useTheme();

  const colors = mode === 'dark' ? {
    one: '#60A5FA',
    two: '#22D3EE',
    three: 'rgba(96, 165, 250, 0.5)',
    four: 'rgba(34, 211, 238, 0.5)',
    five: 'rgba(96, 165, 250, 0.2)',
  } : {
    one: '#3B82F6',
    two: '#06B6D4',
    three: 'rgba(59, 130, 246, 0.5)',
    four: 'rgba(6, 182, 212, 0.5)',
    five: 'rgba(59, 130, 246, 0.2)',
  };

  return (
    <StyledWrapper 
      size={size} 
      animationTime={animationTime} 
      colors={colors}
      userVolume={userVolume} // Pass volume to the styled component
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

// Update the generic type to include userVolume
const StyledWrapper = styled.div<{ size: number; animationTime: number; colors: any; userVolume: number; }>`
  .loader {
    --color-one: ${props => props.colors.one};
    --color-two: ${props => props.colors.two};
    --color-three: ${props => props.colors.three};
    --color-four: ${props => props.colors.four};
    --color-five: ${props => props.colors.five};
    --time-animation: ${props => props.animationTime}s;
    
    // *** CORE FIX AREA ***
    // 1. Base size is set by the AI's state (idle, listening, speaking).
    --base-size: ${props => props.size};
    // 2. An additional scaling factor is calculated from the user's voice volume.
    // This will scale the orb up by a maximum of 25% when the user speaks loudly.
    --voice-pulse-scale: ${props => 1 + (props.userVolume * 0.25)};
    // 3. The shadow intensity also increases with volume, making the glow brighter.
    --shadow-spread: ${props => 25 + (props.userVolume * 30)}px;

    position: relative;
    border-radius: 50%;
    
    // Combine the base size and the voice pulse into a single transform property.
    transform: scale(calc(var(--base-size) * var(--voice-pulse-scale)));
    // Add a fast transition to make the pulse feel snappy and responsive.
    transition: transform 0.1s ease-out;

    // Use the dynamic shadow variable to make the glow react.
    box-shadow:
      0 0 var(--shadow-spread) 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
      
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }

  .loader::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two);
    background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow:
      inset 0 10px 10px 0 var(--color-three),
      inset 0 -10px 10px 0 var(--color-four);
  }

  .loader .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(
      180deg,
      var(--color-one) 30%,
      var(--color-two) 70%
    );
    mask: url(#clipping);
    -webkit-mask: url(#clipping);
  }

  .loader svg {
    position: absolute;
  }

  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }

  .loader svg #clipping polygon {
    filter: blur(7px);
  }

  .loader svg #clipping polygon:nth-child(1) { transform-origin: 75% 25%; transform: rotate(90deg); }
  .loader svg #clipping polygon:nth-child(2) { transform-origin: 50% 50%; animation: rotation var(--time-animation) linear infinite reverse; }
  .loader svg #clipping polygon:nth-child(3) { transform-origin: 50% 60%; animation: rotation var(--time-animation) linear infinite; animation-delay: calc(var(--time-animation) / -3); }
  .loader svg #clipping polygon:nth-child(4) { transform-origin: 40% 40%; animation: rotation var(--time-animation) linear infinite reverse; }
  .loader svg #clpping polygon:nth-child(5) { transform-origin: 40% 40%; animation: rotation var(--time-animation) linear infinite reverse; animation-delay: calc(var(--time-animation) / -2); }
  .loader svg #clipping polygon:nth-child(6) { transform-origin: 60% 40%; animation: rotation var(--time-animation) linear infinite; }
  .loader svg #clipping polygon:nth-child(7) { transform-origin: 60% 40%; animation: rotation var(--time-animation) linear infinite; animation-delay: calc(var(--time-animation) / -1.5); }

  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes roundness {
    0%, 100% { filter: contrast(15); }
    20%, 40% { filter: contrast(3); }
    60% { filter: contrast(15); }
  }

  @keyframes colorize {
    0%, 100% { filter: hue-rotate(0deg); }
    50% { filter: hue-rotate(-45deg); }
  }
`;