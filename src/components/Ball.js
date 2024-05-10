import React, { useEffect } from 'react';
import styled from 'styled-components';

const BallStyled = styled.div`
  width: 20px;
  height: 20px;
  background-color: #f00;
  border-radius: 50%;
  position: absolute;
  $top: ${(props) => props.position.y}px;
  $left: ${(props) => props.position.x}px;
`;

const Ball = ({ position, onCollision, onOutOfBounds }) => {
  useEffect(() => {
    const handleAnimation = () => {
      // Handle ball animation logic
      // You can add bounce, gravity, or other effects here
    };

    const interval = setInterval(handleAnimation, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for collisions or out-of-bounds
    if (position.y > window.innerHeight) {
      onOutOfBounds(); // Call a function when the ball goes out of bounds
    }

    // You can add more collision logic based on your game design
    onCollision && onCollision(position.x, position.y);
  }, [position, onCollision, onOutOfBounds]);

  return <BallStyled position={position} />;
};

export default Ball;

