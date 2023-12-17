import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled component for the base flipper
const FlipperBase = styled.div`
  width: 160px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.3);
`;

// Styled component for the right flipper, extending the FlipperBase
const RightFlipperStyled = styled(FlipperBase)`
  transform-origin: right center;
  transform: rotate(${(props) => (props.up ? '30deg' : '0deg')});
  right: 50px;
  cursor: pointer;
  transition: transform 0.2s ease; /* Added smooth transition */
`;

const RightFlipper = ({ up, onFlip, score }) => {
  // State to manage the rotation of the flipper
  const [rotation, setRotation] = useState(0);

  // Effect to handle flipper lift and lower logic
  useEffect(() => {
    if (up) {
      // Logic for lifting the flipper
      setRotation(30);
    } else {
      // Logic for lowering the flipper
      setRotation(0);
    }
  }, [up]);

  // Effect for additional logic, animations, and behavior
  useEffect(() => {
    // Logic to change flipper color based on conditions
    const flipperElement = document.getElementById('right-flipper');
    if (flipperElement) {
      flipperElement.style.backgroundColor = score >= 100 ? 'gold' : '#777';
    }

    // Particle effects or sparks when the flipper moves
    const addParticleEffect = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      document.body.appendChild(particle);

      // Remove the particle after the animation
      setTimeout(() => {
        particle.remove();
      }, 1000);
    };

    // Attach event listeners or perform actions based on flipper state
    if (rotation === 30) {
      addParticleEffect();
      // Add more actions based on flipper being lifted
    }

    // Note: Be mindful of performance considerations when adding complex logic here
  }, [rotation, score]);

  // Event handler for when the mouse button is pressed
  const handleMouseDown = () => {
    setRotation(45); // Adjust the rotation for the charging effect
  };

  // Event handler for when the mouse button is released
  const handleMouseUp = () => {
    setRotation(up ? 30 : 0);
    onFlip(); // Trigger the flipper action
  };

  return (
    <RightFlipperStyled
      id="right-flipper"
      up={up}
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onAnimationEnd={() => setRotation(0)} // Reset rotation after animation ends
    />
  );
};

export default RightFlipper;
