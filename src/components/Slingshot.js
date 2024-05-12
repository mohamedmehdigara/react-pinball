// Slingshot.js

import React, { useState } from 'react';
import styled from 'styled-components';

// Define the slingshot container
const SlingshotContainer = styled.div`
  position: absolute;
`;

// Define the slingshot base
const SlingshotBase = styled.div`
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: #333;
  border-radius: 50%;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;

// Define the slingshot arm
const SlingshotArm = styled.div`
  position: absolute;
  width: 2px;
  height: ${(props) => props.armLength}px;
  background-color: #666;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
  transform: rotate(${(props) => props.angle}deg);
`;

const Slingshot = ({ top, left, armLength, angle }) => {
  // Define state to track whether the slingshot is activated
  const [activated, setActivated] = useState(false);

  // Function to handle the slingshot activation
  const activateSlingshot = () => {
    // Logic to trigger the slingshot, e.g., apply force to the ball
    setActivated(true);

    // Reset activation state after a delay to simulate the slingshot action
    setTimeout(() => {
      setActivated(false);
    }, 100);
  };

  return (
    <SlingshotContainer>
      {/* Render the slingshot base */}
      <SlingshotBase top={top} left={left} />

      {/* Render the slingshot arm */}
      <SlingshotArm top={top} left={left} armLength={armLength} angle={angle} />

      {/* Add event listener to activate the slingshot on mouse down */}
      <div
        style={{ position: 'absolute', top: top + armLength, left: left, width: 20, height: 20, cursor: 'pointer' }}
        onMouseDown={activateSlingshot}
      ></div>
    </SlingshotContainer>
  );
};

export default Slingshot;
