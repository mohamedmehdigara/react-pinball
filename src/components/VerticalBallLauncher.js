import React, { useState } from 'react';
import styled from 'styled-components';
import  setBallVelocity  from "./Ball"; // Assuming Ball.js exports setBallVelocity

const LauncherButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center the button vertically and horizontally */
  background-color: #333;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
`;


const VerticalBallLauncher = ({ onLaunch, maxBallForce }) => {
  const [ballPosition, setBallPosition] = useState({ x: 400, y: 550 }); // Replace with desired initial position

  const handleBallLaunch = (launchPower = 1) => {
    // Apply launch force to the ball based on launch power (optional)
    const launchForce = launchPower * maxBallForce;

    // Set initial velocity with negative y-value for upward movement
    setBallVelocity({
      x: 0, // Set x-velocity to 0 to prevent rightward movement
      y: -launchForce, // Invert launch force for stronger upward movement (optional)
    });

    // Call the provided onLaunch callback function (optional)
    if (onLaunch) {
      onLaunch();
    }
  };

  return (
    <div> {/* Container for vertical positioning */}
      <LauncherButton onClick={() => handleBallLaunch()}>Launch Ball</LauncherButton> {/* Launch with default power (1) */}
    </div>
  );
};

export default VerticalBallLauncher;
