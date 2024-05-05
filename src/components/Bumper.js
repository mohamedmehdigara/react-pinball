import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a bounce animation
const bounce = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

const BumperContainer = styled.div`
  position: absolute;
`;

const BumperStyled = styled.div`
  width: ${(props) => props.size || '60px'}; /* Increase size for better visibility */
  height: ${(props) => props.size || '60px'}; /* Increase size for better visibility */
  background-color: ${(props) => props.color || '#ffcc00'};
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease;
  animation: ${bounce} 1s ease infinite; /* Apply the bounce animation */

  &:hover {
    background-color: #ff9900; /* Change color on hover */
  }
`;

const Bumper = ({ id, size, color, top, left, onClick }) => {
  const [hit, setHit] = useState(false);

  useEffect(() => {
    // Additional logic when the bumper is hit, e.g., scoring, sound effects, etc.
    // You can call a callback function to handle these actions
    if (hit) {
      onClick && onClick(id);
    }
  }, [hit, id, onClick]);

  const handleClick = () => {
    // Additional logic when the bumper is clicked, e.g., scoring, sound effects, etc.
    // You can call a callback function to handle these actions
    setHit(true);
    setTimeout(() => setHit(false), 500); // Reset hit state after a delay
    onClick && onClick(id);
  };

  return (
    <BumperContainer>
      <BumperStyled
        size={size}
        color={color}
        top={top}
        left={left}
        hit={hit}
        onClick={handleClick}
      />
    </BumperContainer>
  );
};

export default Bumper;
