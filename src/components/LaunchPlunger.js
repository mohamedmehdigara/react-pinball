import React, { useState } from 'react';
import styled from 'styled-components';

const PlungerContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%); /* Center the plunger */
  cursor: pointer; /* Make the plunger clickable/tappable */
`;

const PlungerRod = styled.div`
  width: 10px;
  height: 100px;
  background-color: gray;
  border-radius: 5px;
  transition: transform 0.2s ease-in-out; /* Animation for plunger movement */
`;

const LaunchPlunger = ({ onLaunch, maxPull = 50 }) => {
  const [pullDistance, setPullDistance] = useState(0);

  const handleMouseDown = () => {
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    window.removeEventListener('mouseup', handleMouseUp);
    if (pullDistance > 0) {
      onLaunch(pullDistance / maxPull); // Normalize pull distance to a value between 0 and 1
      setPullDistance(0);
    }
  };

  return (
    <PlungerContainer onMouseDown={handleMouseDown}>
      <PlungerRod style={{ transform: `translateY(${pullDistance}px)` }} />
    </PlungerContainer>
  );
};

export default LaunchPlunger;
