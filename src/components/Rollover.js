import React, { useState } from 'react';
import styled from 'styled-components';

const RolloverContainer = styled.div`
  position: absolute;
`;

const RolloverStyled = styled.div`
  width: ${(props) => props.width || '30px'};
  height: ${(props) => props.height || '30px'};
  background-color: ${(props) => (props.active ? '#00ff00' : '#003300')};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease;

  &:hover {
    background-color: #00cc00; /* Change color on hover */
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
