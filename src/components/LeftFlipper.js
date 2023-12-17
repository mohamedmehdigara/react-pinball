import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FlipperBase = styled.div`
  width: 160px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.3);
`;

const LeftFlipperStyled = styled(FlipperBase)`
  transform-origin: left center;
  transform: rotate(${(props) => (props.up ? '-30deg' : '0deg')});
  left: 50px;
  cursor: pointer;
  transition: transform 0.2s ease; /* Added smooth transition */
`;

const LeftFlipper = ({ up, onFlip, score }) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (up) {
      // Logic for lifting the flipper
      setRotation(-30);
    } else {
      // Logic for lowering the flipper
      setRotation(0);
    }
  }, [up]);

  useEffect(() => {
    // Additional logic for flipper movement or animations
    // You can add more animations or adjust the flipper's behavior here
  
    // For example, you can trigger a sound effect when the flipper moves
  
    // You can change the flipper color based on certain conditions
    const flipperElement = document.getElementById('left-flipper'); // Add an id to your LeftFlipperStyled component
  
    const changeFlipperColor = () => {
      // Logic to change flipper color based on conditions
      // For example, change color when a certain score is reached
      if (score >= 100) {
        flipperElement.style.backgroundColor = 'gold';
      } else {
        flipperElement.style.backgroundColor = '#777';
      }
    };
  
    // You can add particle effects or sparks when the flipper moves
    const addParticleEffect = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      // Add styling or animation properties to the particle
      document.body.appendChild(particle);
  
      // Add logic to remove the particle after the animation
      setTimeout(() => {
        particle.remove();
      }, 1000);
    };
  
    // Attach event listeners or perform actions based on flipper state
    if (rotation === -30) {
      changeFlipperColor();
      addParticleEffect();
      // Add more actions based on flipper being lifted
    }
  
    // Note: Be mindful of performance considerations when adding complex logic here
  }, [rotation, score]); // Include relevant dependencies like 'score' if needed
  
  // Simulate a "charge" effect when the flipper is pressed
  const handleMouseDown = () => {
    setRotation(-45); // Adjust the rotation for the charging effect
  };

  // Reset the flipper rotation when the mouse is released
  const handleMouseUp = () => {
    setRotation(up ? -30 : 0);
    onFlip(); // Trigger the flipper action
  };

  return (
    <LeftFlipperStyled
      id="left-flipper"
      up={up}
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onAnimationEnd={() => setRotation(0)} // Reset rotation after animation ends
    />
  );
};

export default LeftFlipper;
