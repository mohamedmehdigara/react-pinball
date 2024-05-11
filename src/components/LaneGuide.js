import React from 'react';
import styled from 'styled-components';

// Styled component for the lane guide
const LaneGuideContainer = styled.div`
  position: absolute;
`;

const LaneGuideStyled = styled.div`
  width: ${(props) => props.width || '10px'}; /* Adjust width as needed */
  height: ${(props) => props.height || '100px'}; /* Adjust height as needed */
  background-color: transparent; /* Transparent background */
  border: 2px solid #fff; /* White border */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
`;

const LaneGuide = ({ width, height, top, left }) => {
  return (
    <LaneGuideContainer>
      <LaneGuideStyled width={width} height={height} top={top} left={left} />
    </LaneGuideContainer>
  );
};

export default LaneGuide;
