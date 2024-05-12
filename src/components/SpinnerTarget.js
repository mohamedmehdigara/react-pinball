import React from 'react';
import styled, { keyframes } from 'styled-components';

// Define the spinning animation
const spinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled component for the spinner target
const SpinnerTargetContainer = styled.div`
  position: absolute;
`;

const SpinnerTarget = styled.div`
  width: ${(props) => props.size || '50px'};
  height: ${(props) => props.size || '50px'};
  background-color: ${(props) => props.color || '#FFD700'};
  border-radius: 50%;
  position: absolute;
  top: ${(props) => props.top || '0'};
  left: ${(props) => props.left || '0'};
  animation: ${spinAnimation} ${(props) => props.speed || '2s'} linear infinite; // Adjust speed as needed
`;

export default SpinnerTarget;
