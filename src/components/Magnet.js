import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const MagnetContainer = styled.div`
  position: absolute;
`;

const MagnetStyled = styled.div`
  width: ${(props) => props.size || '30px'};
  height: ${(props) => props.size || '30px'};
  background-color: #8B0000; /* Dark red color for the magnet */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  border-radius: 50%; /* Rounded shape for magnet */

  /* Add box shadow to create depth */
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
`;

const Magnet = ({ id, size, top, left, magneticForce, onMagnetize }) => {
  const [isMagnetized, setIsMagnetized] = useState(false);

  useEffect(() => {
    const handleMagnetize = () => {
      // Logic to check if the ball is within the magnetic range
      // You'll need to implement this based on your game's physics
      const isInMagneticRange = true; // Implement this logic

      if (isInMagneticRange) {
        setIsMagnetized(true);
        onMagnetize && onMagnetize(id, magneticForce);
        // You can add more logic here if needed
      }
    };

    const handleDemagnetize = () => {
      setIsMagnetized(false);
      // You can add more logic here if needed
    };

    // Add event listeners for magnetizing and demagnetizing
    // Implement these events based on your game's physics
    // document.addEventListener('someEvent', handleMagnetize);
    // document.addEventListener('someOtherEvent', handleDemagnetize);

    // Clean up event listeners
    return () => {
      // document.removeEventListener('someEvent', handleMagnetize);
      // document.removeEventListener('someOtherEvent', handleDemagnetize);
    };
  }, [id, magneticForce, onMagnetize]);

  return (
    <MagnetContainer>
      {isMagnetized && (
        <MagnetStyled size={size} top={top} left={left} />
      )}
    </MagnetContainer>
  );
};

export default Magnet;
