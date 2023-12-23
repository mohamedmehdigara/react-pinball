import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const KickbackContainer = styled.div`
  position: absolute;
`;

const KickbackStyled = styled.div`
  width: ${(props) => props.width || '20px'};
  height: ${(props) => props.height || '100px'};
  background-color: ${(props) => (props.active ? '#ffcc00' : '#996633')};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease;

  &:hover {
    background-color: #cc9900; /* Change color on hover */
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
    <KickbackContainer>
      <KickbackStyled
        width={width}
        height={height}
        top={top}
        left={left}
        active={active}
        onClick={handleClick}
      />
    </KickbackContainer>
  );
};

export default Kickback;
