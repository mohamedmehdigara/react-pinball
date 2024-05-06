import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  50% { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
`;

const MysteryTargetContainer = styled.div`
  position: absolute;
`;

const MysteryTargetStyled = styled.div`
  width: 50px;
  height: 50px;
  background-color: #9932CC; /* Purple color for the mystery target */
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  animation: ${rotate} 2s linear infinite; /* Apply rotation animation */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); /* Add a subtle shadow */
`;

const MysteryTarget = ({ id, top, left, onHit }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClick = () => {
    setIsVisible(false);
    onHit && onHit(id);

    // Trigger your random event or bonus logic here
    console.log('Mystery target hit! Triggering a random event or bonus...');
  };

  return (
    <MysteryTargetContainer>
      {isVisible && <MysteryTargetStyled top={top} left={left} onClick={handleClick} />}
    </MysteryTargetContainer>
  );
};

export default MysteryTarget;
