import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const KickbackContainer = styled.div`
  position: absolute;
`;

const KickbackStyled = styled.div`
  width: ${(props) => props.width || '30px'}; /* Adjust the width for better visibility */
  height: ${(props) => props.height || '100px'};
  background-color: ${(props) => (props.active ? '#FFD700' : '#A52A2A')}; /* Adjust colors */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease;

  &:hover {
    background-color: ${(props) => (props.active ? '#FFD700' : '#B22222')}; /* Adjust hover color */
  }
`;

const Kickback = ({ id, width, height, top, left, onActivate }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Additional logic when the kickback is activated, e.g., saving the ball
    if (active) {
      onActivate && onActivate(id);
    }
  }, [active, id, onActivate]);

  const handleClick = () => {
    // Additional logic when the kickback is clicked, e.g., sound effects, etc.
    setActive(true);
    setTimeout(() => setActive(false), 1000); // Deactivate after a delay
  };

  return (
    <KickbackContainer style={{ top: top, left: left }}> {/* Adjust position */}
      <KickbackStyled
        width={width}
        height={height}
        active={active}
        onClick={handleClick}
      />
    </KickbackContainer>
  );
};

export default Kickback;
