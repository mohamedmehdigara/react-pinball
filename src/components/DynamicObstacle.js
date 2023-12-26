import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a back and forth animation
const moveBackAndForth = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(100px); // Adjust the distance of the movement
  }
`;

const Obstacle = styled.div`
  width: 50px;
  height: 20px;
  background-color: #333;
  position: absolute;
  top: 200px; // Adjust the vertical position
  animation: ${moveBackAndForth} 2s linear infinite; // Adjust the duration
`;

const DynamicObstacle = ({ onCollision }) => {
  // Use state to manage the position of the obstacle
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const handleAnimation = () => {
      // Update the position state to trigger a re-render
      setPosition((prevPosition) => (prevPosition === 0 ? 100 : 0));
    };

    // Set up the interval for the back and forth movement
    const interval = setInterval(handleAnimation, 2000); // Adjust the interval as needed

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for collisions
    onCollision && onCollision();
  }, [position, onCollision]);

  return <Obstacle style={{ transform: `translateX(${position}px)` }} />;
};

export default DynamicObstacle;
