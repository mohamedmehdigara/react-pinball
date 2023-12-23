import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const LaneGuideContainer = styled.div`
  position: absolute;
`;

const LaneGuideStyled = styled.div`
  width: ${(props) => props.width || '20px'};
  height: ${(props) => props.height || '80px'};
  background-color: ${(props) => props.color || '#00ff00'};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease;

  &:hover {
    background-color: #00cc00; /* Change color on hover */
  }
`;

const LaneGuide = ({ id, width, height, color, top, left, onHit }) => {
  const [hit, setHit] = useState(false);

  useEffect(() => {
    // Additional logic when the lane guide is hit, e.g., redirect the ball
    if (hit) {
      onHit && onHit(id);
    }
  }, [hit, id, onHit]);

  const handleClick = () => {
    // Additional logic when the lane guide is clicked, e.g., scoring, sound effects, etc.
    setHit(true);
    setTimeout(() => setHit(false), 500); // Reset hit state after a delay
    onHit && onHit(id);
  };

  return (
    <LaneGuideContainer>
      <LaneGuideStyled
        width={width}
        height={height}
        color={color}
        top={top}
        left={left}
        hit={hit}
        onClick={handleClick}
      />
    </LaneGuideContainer>
  );
};

export default LaneGuide;
