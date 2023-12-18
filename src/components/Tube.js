import React from 'react';
import styled, { keyframes } from 'styled-components';

// Define a pulse animation
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const Tube = ({ type }) => {
  const getTubePosition = () => {
    switch (type) {
      case 'top':
        return { top: '50px', left: '300px' };
      case 'middle':
        return { top: '200px', left: '600px' };
      case 'bottom':
        return { top: '400px', left: '300px' };
      default:
        return {};
    }
  };

  return (
    <TubeContainer type={type} style={{ ...getTubePosition() }}>
    <svg
      width="100"
      height="100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Your SVG content here */}
      <circle cx="50" cy="50" r="45" fill="#fff" />
    </svg>
  </TubeContainer>
  );
};

const TubeContainer = styled.div`
  width: 100px;
  height: 100px;
  background-color: #777;
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease; /* Smooth transitions for color and scale */

  &:hover {
    background-color: #888; /* Change color on hover */
    transform: scale(1.1); /* Scale up on hover */
    animation: ${pulse} 0.5s ease infinite; /* Apply the pulse animation on hover */
  }
`;

export default Tube;
