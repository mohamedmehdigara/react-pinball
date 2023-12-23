import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a bounce animation
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const CaptiveBallContainer = styled.div`
  position: absolute;
`;

const CaptiveBallStyled = styled.div`
  width: ${(props) => props.size || '20px'};
  height: ${(props) => props.size || '20px'};
  background-color: #FFD700; /* Gold color for the captive ball */
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  animation: ${bounce} 1s ease infinite; /* Apply the bounce animation */
`;

const CaptiveBall = ({ id, size, top, left, isReleased, onRelease }) => {
  const [released, setReleased] = useState(false);

  useEffect(() => {
    if (isReleased) {
      // Logic to release the captive ball
      setReleased(true);
      onRelease && onRelease(id);
    }
  }, [isReleased, id, onRelease]);

  const handleClick = () => {
    // Logic when the captive ball is clicked, e.g., scoring, etc.
    console.log(`Captive Ball ${id} clicked!`);
  };

  return (
    <CaptiveBallContainer>
      {!released && (
        <CaptiveBallStyled size={size} top={top} left={left} onClick={handleClick} />
      )}
    </CaptiveBallContainer>
  );
};

export default CaptiveBall;
