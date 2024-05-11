import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define animation for obstacle movement
const moveAnimation = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

const ObstacleContainer = styled.div`
  position: absolute;
`;

const Obstacle = styled.div`
  width: 50px;
  height: 20px;
  background-color: #964B00; /* Brown color for the obstacle */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  animation: ${moveAnimation} 2s ease-in-out infinite; /* Apply the movement animation */
`;

const DynamicObstacle = ({ initialTop, initialLeft }) => {
  const [top, setTop] = useState(initialTop || 0);
  const [left, setLeft] = useState(initialLeft || 0);

  useEffect(() => {
    // Add logic here to update top and left positions if needed
    const interval = setInterval(() => {
      // Calculate new top and left positions based on some conditions or game state
      const newTop = Math.random() * (window.innerHeight - 100); // Example: Randomize top position within the window height
      const newLeft = Math.random() * (window.innerWidth - 100); // Example: Randomize left position within the window width
  
      // Update the state with the new positions
      setTop(newTop);
      setLeft(newLeft);
    }, 3000); // Update positions every 3 seconds (adjust this interval as needed)
  
    // Clean up the interval to prevent memory leaks
    return () => clearInterval(interval);
  }, []); // Add dependencies as needed
  
  return (
    <ObstacleContainer>
      <Obstacle top={top} left={left} />
    </ObstacleContainer>
  );
};

export default DynamicObstacle;
