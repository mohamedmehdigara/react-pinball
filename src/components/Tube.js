// Tube.js
import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const TubeContainer = styled.div`
  position: absolute;
  cursor: pointer;
  ${(props) => {
    switch (props.type) {
      case 'vertical':
        return 'top: 50px; right: 50px;'; // Adjust positioning based on your design
      default:
        return '';
    }
  }}
  transition: background-color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: #888;
    transform: scale(1.1);
    animation: ${pulse} 0.5s ease infinite;
  }
`;

const Tube = ({ type }) => {
  return <TubeContainer type={type} />;
};

export default Tube;
