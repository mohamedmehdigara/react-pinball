import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Styled components for the Rollover
const RolloverContainer = styled.div`
  position: absolute;
`;

const RolloverStyled = styled.div`
  width: 50px;
  height: 20px;
  background-color: ${(props) => (props.active ? '#00ff00' : '#808080')};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
`;

const Rollover = ({ top, left }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Add logic here to handle rollover activation if needed
  }, []); // Add dependencies as needed

  const handleClick = () => {
    // Add logic here to handle rollover click if needed
    setIsActive(!isActive); // Toggle isActive state
  };

  return (
    <RolloverContainer>
      <RolloverStyled
        top={top}
        left={left}
        active={isActive}
        onClick={handleClick}
      />
    </RolloverContainer>
  );
};

export default Rollover;
