import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Styled components for the RightFlipper
const FlipperContainer = styled.div`
  position: absolute;
`;

const FlipperStyled = styled.div`
  width: 80px;
  height: 20px;
  background-color: #ff0000;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  transform-origin: ${(props) => (props.flip ? 'left' : 'right')};
  transform: ${(props) => (props.flip ? 'rotate(30deg)' : 'rotate(-30deg)')};
  cursor: pointer;
`;

const RightFlipper = ({ top, left }) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    // Add logic here to handle flipper movement if needed
  }, []); // Add dependencies as needed

  const handleClick = () => {
    // Add logic here to handle flipper click if needed
    setFlipped(!flipped); // Toggle flipped state
  };

  return (
    <FlipperContainer>
      <FlipperStyled
        top={top}
        left={left}
        flip={flipped}
        onClick={handleClick}
      />
    </FlipperContainer>
  );
};

export default RightFlipper;
