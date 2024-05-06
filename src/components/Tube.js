import React from 'react';
import styled, { keyframes } from 'styled-components';

// Define a pulse animation
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const TubeContainer = styled.div`
  width: 30px;
  height: 120px; /* Adjusted height to resemble a tube */
  background-color: #ccc; /* Light gray color for the tube */
  position: absolute;
  cursor: pointer;
  ${(props) => {
    switch (props.type) {
      case 'vertical':
        return 'top: 50px; left: 50px;'; // Adjusted position to resemble a real tube
      default:
        return '';
    }
  }}
  transition: background-color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: #888; /* Darker color on hover */
    transform: scale(1.1);
    animation: ${pulse} 0.5s ease infinite; /* Apply the pulse animation on hover */
  }
`;

const Tube = ({ type }) => {
  return <TubeContainer type={type} />;
};

export default Tube;
