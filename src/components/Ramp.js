// Ramp.js

import React from 'react';
import styled from 'styled-components';

const RampContainer = styled.div`
  position: absolute;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
  background-color: #654321; /* Brown color for the ramp */
  transform: rotate(${(props) => props.angle}deg); /* Rotate the ramp */
  border-radius: 10px; /* Rounded corners for the ramp */
  border: 2px solid #000; /* Border for better visibility */
`;

const Ramp = ({ width, height, top, left, angle }) => {
  return (
    <RampContainer width={width} height={height} top={top} left={left} angle={angle}>
      {/* Add any additional content or children here */}
    </RampContainer>
  );
};

export default Ramp;
