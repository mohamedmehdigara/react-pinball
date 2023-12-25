import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SkillShot = ({ onSkillShot }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // You can trigger the skill shot target based on your game logic
    // For example, it becomes active for a short duration after launching a new ball

    const timeout = setTimeout(() => {
      setIsActive(true);

      // You can add additional logic here, e.g., countdown timer for the skill shot
      const countdown = setTimeout(() => {
        setIsActive(false);
        clearTimeout(countdown);
      }, 3000); // Adjust the duration as needed
    }, 2000); // Adjust the delay before the skill shot becomes active

    return () => clearTimeout(timeout);
  }, []);

  const handleSkillShot = () => {
    if (isActive) {
      // Player successfully hit the skill shot
      onSkillShot && onSkillShot();
      setIsActive(false);
    }
  };

  const SkillShotTarget = styled.div`
    width: 50px;
    height: 50px;
    background-color: ${isActive ? '#00ff00' : '#ff0000'};
    border: 2px solid #000;
    border-radius: 50%;
    position: absolute;
    top: 50px;
    left: 50px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  `;

  return <SkillShotTarget onClick={handleSkillShot} />;
};

export default SkillShot;
