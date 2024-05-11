import React from 'react';
import styled from 'styled-components';

// Styled component for the left flipper
const LeftFlipperContainer = styled.div`
  position: absolute;
  transform-origin: right center; /* Set the rotation pivot point */
  bottom: 20px; /* Adjust the distance from the bottom */
  left: 20px; /* Adjust the distance from the left */
`;

const LeftFlipperStyled = styled.div`
  width: ${(props) => props.width || '100px'}; /* Adjust width as needed */
  height: ${(props) => props.height || '20px'}; /* Adjust height as needed */
  background-color: #ccc; /* Gray color for the flipper */
  border-radius: 8px; /* Rounded corners for the flipper */
  transform: rotate(${(props) => props.angle || 0}deg); /* Rotate the flipper */
`;

const LeftFlipper = ({ width, height, angle }) => {
  return (
    <LeftFlipperContainer>
      <LeftFlipperStyled width={width} height={height} angle={angle} />
    </LeftFlipperContainer>
  );
};

export default LeftFlipper;

