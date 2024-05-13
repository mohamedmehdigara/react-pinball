import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled component for the left flipper
const LeftFlipperContainer = styled.div`
  position: absolute;
  transform-origin: left bottom; /* Set the rotation pivot point to the bottom left corner */
  bottom: 20px; /* Adjust the distance from the bottom */
  left: 100px; /* Adjust the distance from the left */
  width: 100px; /* Adjust the width of the flipper */
  height: 20px; /* Adjust the height of the flipper */
  background-color: #ccc; /* Gray color for the flipper */
  border-radius: 10px 0 0 10px; /* Rounded corners for the flipper */
  transition: transform 0.1s ease; /* Add smooth transition for flipper rotation */
  transform: rotate(45deg); /* Rotate the flipper initially */
`;

const LeftFlipper = () => {
  const [activated, setActivated] = useState(false);

  // Handle key down event to activate the flipper
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      setActivated(true);
    }
  };

  // Handle key up event to deactivate the flipper
  const handleKeyUp = (event) => {
    if (event.key === 'ArrowLeft') {
      setActivated(false);
    }
  };

  useEffect(() => {
    // Add event listeners for key down and key up
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Remove event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array to run only once when component mounts

  return <LeftFlipperContainer style={{ transform: `rotate(${activated ? -90 : 45}deg)` }} />;
};

export default LeftFlipper;
