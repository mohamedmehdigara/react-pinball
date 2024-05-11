import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled component for the kickout hole
const KickoutHoleContainer = styled.div`
  position: absolute;
`;

const KickoutHoleStyled = styled.div`
  width: ${(props) => props.size || '50px'}; /* Adjust size as needed */
  height: ${(props) => props.size || '50px'}; /* Adjust size as needed */
  background-color: #000; /* Black color for the kickout hole */
  border-radius: 50%; /* Rounded shape for the hole */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
`;

const KickoutHole = ({ size, top, left, onBallEnter }) => {
  const [isBallInside, setIsBallInside] = useState(false);

  useEffect(() => {
    // Add logic to detect when the ball enters the kickout hole
    // You can implement this based on your game's physics
    const handleBallEnter = () => {
      setIsBallInside(true);
      onBallEnter && onBallEnter();
    };

    // Add event listeners for ball enter event
    // Adjust this based on your game's logic
    // document.addEventListener('ballEnter', handleBallEnter);

    // Clean up event listeners
    return () => {
      // document.removeEventListener('ballEnter', handleBallEnter);
    };
  }, [onBallEnter]);

  return (
    <KickoutHoleContainer>
      {!isBallInside && (
        <KickoutHoleStyled size={size} top={top} left={left} />
      )}
    </KickoutHoleContainer>
  );
};

export default KickoutHole;
