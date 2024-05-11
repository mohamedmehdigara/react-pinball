import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a kick animation
const kickAnimation = keyframes`
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-20deg); }
  100% { transform: rotate(0deg); }
`;

// Styled component for the kickback
const KickbackContainer = styled.div`
  position: absolute;
`;

const KickbackStyled = styled.div`
  width: ${(props) => props.width || '100px'};
  height: ${(props) => props.height || '20px'};
  background-color: #8B4513; /* Brown color for the kickback */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  animation: ${kickAnimation} 0.5s ease; /* Apply the kick animation */

  &:hover {
    background-color: #A0522D; /* Darker brown color on hover */
  }
`;

const Kickback = ({ width, height, top, left, onClick }) => {
  const [isKicked, setIsKicked] = useState(false);

  useEffect(() => {
    const handleKick = () => {
      setIsKicked(true);
      setTimeout(() => setIsKicked(false), 500); // Reset isKicked state after a delay
      onClick && onClick();
    };

    // Add event listener for kick action
    // Adjust this based on your game's logic
    // document.addEventListener('someEvent', handleKick);

    // Clean up event listener
    return () => {
      // document.removeEventListener('someEvent', handleKick);
    };
  }, [onClick]);

  return (
    <KickbackContainer>
      {!isKicked && (
        <KickbackStyled
          width={width}
          height={height}
          top={top}
          left={left}
          onClick={onClick}
        />
      )}
    </KickbackContainer>
  );
};

export default Kickback;
