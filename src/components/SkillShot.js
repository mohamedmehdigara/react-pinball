import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled components for the SkillShot
const SkillShotContainer = styled.div`
  position: absolute;
`;

const SkillShotStyled = styled.div`
  width: 20px;
  height: 20px;
  background-color: ${(props) => (props.isActive ? '#ff0000' : '#cccccc')};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
`;

const SkillShot = ({ top, left }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Add logic here to handle skillshot activation if needed
  }, []); // Add dependencies as needed

  const handleClick = () => {
    // Add logic here to handle skillshot click if needed
    setIsActive(!isActive); // Toggle isActive state
  };

  return (
    <SkillShotContainer>
      <SkillShotStyled
        top={top}
        left={left}
        isActive={isActive}
        onClick={handleClick}
      />
    </SkillShotContainer>
  );
};

export default SkillShot;
