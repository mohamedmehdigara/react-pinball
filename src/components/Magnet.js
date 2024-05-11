import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a magnetic force animation
const magneticForce = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
`;

// Styled components for the Magnet
const MagnetContainer = styled.div`
  position: absolute;
`;

const MagnetStyled = styled.div`
  width: ${(props) => props.size || '30px'};
  height: ${(props) => props.size || '30px'};
  background-color: #8B0000; /* Dark red color for the magnet */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  border-radius: 50%; /* Rounded shape for magnet */
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3); /* Add box shadow for depth */
  animation: ${magneticForce} 1s ease infinite alternate; /* Apply the magnetic force animation */
`;

const Magnet = ({ size, top, left }) => {
  return (
    <MagnetContainer>
      <MagnetStyled size={size} top={top} left={left} />
    </MagnetContainer>
  );
};

export default Magnet;

