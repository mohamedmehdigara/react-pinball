import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define animation for loop shot
const loopAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled component for loop shot
const LoopShotContainer = styled.div`
  position: absolute;
  width: ${(props) => props.size || '100px'};
  height: ${(props) => props.size || '100px'};
  top: ${(props) => props.top || '0'};
  left: ${(props) => props.left || '0'};
`;

const Loop = styled.div`
  width: 100%;
  height: 100%;
  border: 2px solid #fff;
  border-radius: 50%;
  animation: ${loopAnimation} ${(props) => props.speed || '5s'} linear infinite;
`;

const LoopShot = ({ size, top, left, speed }) => {
  return (
    <LoopShotContainer size={size} top={top} left={left}>
      <Loop speed={speed} />
    </LoopShotContainer>
  );
};

export default LoopShot;
