import React, { useState, useRef } from 'react';
import styled from 'styled-components';

// Styled components for the plunger
const PlungerContainer = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 50px;
  height: 150px;
  background-color: #555;
  border-radius: 10px;
  border: 2px solid #333;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  cursor: pointer;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
`;

const PlungerHandle = styled.div`
  width: 30px;
  height: ${props => props.height}px; /* Dynamic height based on pull */
  background-color: #ff5555;
  border-radius: 5px;
  border: 2px solid #aa3333;
  transition: height 0.1s ease-out;
`;

const PlungerButton = styled.div`
  width: 40px;
  height: 20px;
  background-color: #cc0000;
  border-radius: 5px;
  border: 2px solid #990000;
  position: absolute;
  bottom: 0;
  transform: translateY(50%);
  z-index: 10;
`;

const PlungerLane = styled.div`
  position: absolute;
  right: 60px;
  bottom: 10px;
  width: 30px;
  height: 150px;
  background-color: #333;
  border-left: 2px solid #222;
  border-bottom: 2px solid #222;
`;

// Constants for Plunger Physics
const MAX_PULL_HEIGHT = 100; // Max pixels the plunger can be pulled
const LAUNCH_FORCE_MULTIPLIER = 0.2; // Adjust this to control ball velocity

/**
 * A component representing the ball plunger.
 * @param {object} props - The component props.
 * @param {function} props.onLaunch - The function to call when the ball is launched.
 * @param {boolean} props.isReady - Whether the plunger is ready to launch (e.g., a new ball has been delivered).
 */
const BallPlunger = ({ onLaunch, isReady }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullHeight, setPullHeight] = useState(0);
  const startTime = useRef(null);

  const handleMouseDown = () => {
    if (isReady) {
      setIsPulling(true);
      startTime.current = Date.now();
      // Start a timer to animate the pull if needed, or just let mouseUp handle it
    }
  };

  const handleMouseUp = () => {
    if (isPulling) {
      const endTime = Date.now();
      const holdDuration = endTime - startTime.current;
      const launchForce = Math.min(holdDuration * LAUNCH_FORCE_MULTIPLIER, MAX_PULL_HEIGHT);
      
      // Calculate initial velocity based on force.
      // Negative Y because we want to launch the ball upwards.
      const initialVelocity = { x: 0, y: -(launchForce * 0.1) }; 

      // Call the launch function provided by the parent component
      onLaunch(initialVelocity);

      setIsPulling(false);
      setPullHeight(0);
    }
  };

  const handleMouseMove = (e) => {
    if (isPulling) {
      const mouseDeltaY = e.movementY;
      setPullHeight(prevHeight => 
        Math.max(0, Math.min(MAX_PULL_HEIGHT, prevHeight + mouseDeltaY))
      );
    }
  };

  // Add event listeners for mouse up on the window to handle cases where the mouse leaves the component
  React.useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPulling]);

  return (
    <>
      <PlungerContainer
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp} // Trigger release if mouse leaves the area
      >
        <PlungerHandle height={pullHeight} />
        <PlungerButton />
      </PlungerContainer>
      <PlungerLane />
    </>
  );
};

export default BallPlunger;