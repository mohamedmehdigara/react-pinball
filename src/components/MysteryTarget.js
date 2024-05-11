import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Styled components for the MysteryTarget
const MysteryTargetContainer = styled.div`
  position: absolute;
`;

const MysteryTargetStyled = styled.div`
  width: ${(props) => props.size || '30px'};
  height: ${(props) => props.size || '30px'};
  background-color: ${(props) => (props.hit ? '#ff0000' : '#777')};
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.5s ease;
`;

const bounceAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

const MysteryTarget = ({ size, top, left, onClick }) => {
  const [hit, setHit] = useState(false);

  useEffect(() => {
    // Additional logic when the mystery target is hit
    // You can add scoring or other effects here
    if (hit) {
      // Trigger any action when the target is hit
      onClick && onClick();
    }
  }, [hit, onClick]);

  const handleClick = () => {
    // Additional logic when the mystery target is clicked
    setHit(true); // Set hit to true when the target is clicked
  };

  return (
    <MysteryTargetContainer>
      <MysteryTargetStyled
        size={size}
        top={top}
        left={left}
        hit={hit}
        onClick={handleClick}
      />
    </MysteryTargetContainer>
  );
};

export default MysteryTarget;
