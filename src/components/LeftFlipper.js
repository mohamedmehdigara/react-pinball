import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled component for the left flipper
const LeftFlipperContainer = styled.div`
  position: absolute;
  transform-origin: right center; /* Set the rotation pivot point */
  bottom: 20px; /* Adjust the distance from the bottom */
  left: 20px; /* Adjust the distance from the left */
  transition: transform 0.2s ease; /* Add smooth transition for flipper rotation */
`;

const LeftFlipperStyled = styled.div`
  width: ${(props) => props.width || '120px'}; /* Adjust width as needed */
  height: ${(props) => props.height || '20px'}; /* Adjust height as needed */
  background-color: ${(props) => (props.activated ? '#FF5733' : '#ccc')}; /* Change color based on activation */
  border-radius: 8px; /* Rounded corners for the flipper */
`;

const LeftFlipper = ({ width, height }) => {
  const [activated, setActivated] = useState(false);

  // Handle left arrow key press to activate the flipper
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      setActivated(true);
    }
  };

  // Handle releasing the left arrow key to deactivate the flipper
  const handleKeyUp = (event) => {
    if (event.key === 'ArrowLeft') {
      setActivated(false);
    }
  };

  useEffect(() => {
    // Add event listeners for keydown and keyup
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Remove event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array to run only once when component mounts

  return (
    <LeftFlipperContainer>
      <LeftFlipperStyled width={width} height={height} activated={activated} />
    </LeftFlipperContainer>
  );
};

export default LeftFlipper;

