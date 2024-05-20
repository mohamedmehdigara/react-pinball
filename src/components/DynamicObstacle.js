import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



const PLAY_AREA_WIDTH = 800; // Adjust based on your play area dimensions
const PLAY_AREA_HEIGHT = 600; // Adjust based on your play area dimensions

const DynamicObstacle = ({props,
  width = 30,
  height = 30,
  animationDuration = 2,
  movementDistance = 50,
  onCollision,
}) => {
  const [obstaclePosition, setObstaclePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Simulate random initial position (optional)
    setObstaclePosition({
      x: Math.random() * (PLAY_AREA_WIDTH - width),
      y: Math.random() * (PLAY_AREA_HEIGHT - height),
    });
  }, []);

  const handleCollision = (ballPosition) => {
    // Implement collision logic with the ball
    if (onCollision) {
      onCollision(ballPosition, obstaclePosition);
    }
  };

  const Obstacle = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #999;
  border-radius: 50%;

 
`;

  return (
    <Obstacle
      style={{ top: obstaclePosition.y, left: obstaclePosition.x }}
      width={width}
      height={height}
      animationDuration={animationDuration}
      movementDistance={movementDistance}
      onCollision={handleCollision}
    />
  );
};

export default DynamicObstacle;
