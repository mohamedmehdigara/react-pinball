import React from 'react';
import styled, { keyframes } from 'styled-components';

// Define a pulse animation
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const Tube = styled.div`
  width: 100px;
  height: 100px;
  background-color: #777;
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  ${(props) => {
    switch (props.type) {
      case 'top':
        return 'top: 50px; left: 300px;';
      case 'middle':
        return 'top: 200px; left: 600px;';
      case 'bottom':
        return 'top: 400px; left: 300px;';
      default:
        return '';
    }
  }}
  transition: background-color 0.3s ease; /* Smooth color transition */

  &:hover {
    background-color: #888; /* Change color on hover */
    animation: ${pulse} 0.5s ease infinite; /* Apply the pulse animation on hover */
  }
`;

export default Tube;
