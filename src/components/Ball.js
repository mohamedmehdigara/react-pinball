import React, { useEffect } from 'react';
import styled from 'styled-components';


const Ball = ({ position, speed, onCollision, onOutOfBounds }) => {

  useEffect(() => {
    const handleAnimation = () => {
      // Handle ball animation logic
      // You can add bounce, gravity, or other effects here
    };

    const interval = setInterval(handleAnimation, 16);
    return () => clearInterval(interval);
  }, [position, speed]);

  useEffect(() => {
    // Check for collisions or out-of-bounds
    if (position.y > window.innerHeight) {
      onOutOfBounds(); // Call a function when the ball goes out of bounds
    }

    // You can add more collision logic based on your game design
    onCollision(position.x, position.y);
  }, [position, onCollision, onOutOfBounds]);
  const Ball = styled.div`
  width: 20px;
  height: 20px;
  background-color: #f00;
  border-radius: 50%;
  position: absolute;
  
  transition: top 0.1s, left 0.1s; /* Add smooth transition */
`;

  return <Ball style={{ top: position.y, left: position.x }} />;



  

}
export default Ball;
