import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Define keyframes for animation
const glow = keyframes`
  0% {
    box-shadow: 0 0 5px #ff0, 0 0 10px #ff0, 0 0 15px #ff0;
  }
  50% {
    box-shadow: 0 0 20px #ff0, 0 0 30px #ff0, 0 0 40px #ff0;
  }
  100% {
    box-shadow: 0 0 5px #ff0, 0 0 10px #ff0, 0 0 15px #ff0;
  }
`;

const SkillShotLaneContainer = styled.div`
  position: absolute;
  top: ${({ top }) => top || 0}px;
  left: ${({ left }) => left || 0}px;
  width: 60px;
  height: 400px;
  background-color: rgba(255, 215, 0, 0.3);
  border: 2px solid #ff0;
  border-radius: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${({ active }) => active ? `${glow} 1s infinite alternate` : 'none'};
`;

const SkillShotIndicator = styled.div`
  width: 80%;
  height: 5px;
  background-color: ${({ active }) => (active ? '#ff0' : '#555')};
  transition: background-color 0.3s;
  position: absolute;
  bottom: ${({ position }) => position || 0}%;
`;

const SkillShotLane = ({ top, left, initialActive = false }) => {
  const [active, setActive] = useState(initialActive);
  const [indicatorPosition, setIndicatorPosition] = useState(0);

  const handleSkillShot = () => {
    setActive(true);
    setIndicatorPosition(Math.random() * 100);
    setTimeout(() => setActive(false), 1000); // Deactivate after 1 second
  };

  return (
    <SkillShotLaneContainer top={top} left={left} active={active} onClick={handleSkillShot}>
      <SkillShotIndicator position={indicatorPosition} active={active} />
      {/* Add any additional graphics or elements here */}
    </SkillShotLaneContainer>
  );
};

export default SkillShotLane;
