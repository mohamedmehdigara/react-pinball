import React, { useState } from 'react';
import styled from 'styled-components';

const RolloverContainer = styled.div`
  position: absolute;
`;

const RolloverStyled = styled.div`
  width: ${(props) => props.width || '30px'};
  height: ${(props) => props.height || '30px'};
  background-color: ${(props) => (props.active ? '#FFD700' : '#8B4513')}; /* Goldenrod color for active, SaddleBrown for inactive */
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease, transform 0.2s ease; /* Add transition for smoother hover effect */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); /* Add a subtle shadow */

  &:hover {
    background-color: ${(props) => (props.active ? '#FFA500' : '#A0522D')}; /* Darken the color on hover */
    transform: scale(1.1); /* Scale up slightly on hover for a visual effect */
  }
`;

const Rollover = ({ id, width, height, top, left, onRoll }) => {
  const [active, setActive] = useState(false);

  const handleRoll = () => {
    setActive(true);
    onRoll && onRoll(id);
    // You can add more logic here if needed
  };

  return (
    <RolloverContainer>
      <RolloverStyled
        width={width}
        height={height}
        top={top}
        left={left}
        active={active}
        onClick={handleRoll}
      />
    </RolloverContainer>
  );
};

export default Rollover;
