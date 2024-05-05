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
  width: 80px; /* Adjust the width for better visibility */
  height: 30px; /* Adjust the height for better visibility */
  background-color: #888; /* Adjust the color to match the theme */
  position: absolute;
  top: 150px; /* Adjust the vertical position */
  animation: ${moveBackAndForth} 2s linear infinite; // Adjust the duration and easing
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
