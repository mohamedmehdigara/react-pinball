// src/components/MysterySaucer.js
import React, { useRef, useState, useEffect, useImperativeHandle } from 'react';
import styled, { keyframes, css } from 'styled-components';
import PropTypes from 'prop-types';

const glowPulse = keyframes`
  0% { box-shadow: 0 0 8px rgba(0, 255, 255, 0.6); }
  50% { box-shadow: 0 0 15px rgba(0, 255, 255, 1); }
  100% { box-shadow: 0 0 8px rgba(0, 255, 255, 0.6); }
`;

const SaucerContainer = styled.div`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: #333; /* Dark background */
  border-radius: 50%; /* Circular saucer */
  border: 3px solid #00cccc; /* Teal border */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  z-index: 20;

  ${props => props.isLit && css`
    animation: ${glowPulse} 1.5s infinite alternate;
  `}
`;

const SaucerText = styled.div`
  color: ${props => props.isLit ? '#00ffff' : '#888'};
  font-size: ${props => props.size * 0.25}px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
`;

const MysterySaucer = React.forwardRef(({
  top,
  left,
  size = 60,
  onActivate, // Callback when ball enters
  initialIsLit = false,
  scoreValue = 500 // Base score for hitting the saucer
}, ref) => {
  const saucerRef = useRef(null);
  const [isLit, setIsLit] = useState(initialIsLit);
  const [isActivated, setIsActivated] = useState(false); // Internal state to prevent rapid re-activation

  // Method called by Pinball.js when ball hits the saucer
  const handleCollision = () => {
    if (!isActivated) {
      setIsActivated(true); // Prevent further activation until reset
      setIsLit(false); // Turn off light
      if (onActivate) {
        onActivate(scoreValue); // Trigger the mystery feature in parent
      }
      // Saucer "captures" the ball briefly, so physics needs to handle it
      // The parent (Pinball.js) will typically remove the ball from play briefly
      // and then return it.
      return scoreValue; // Return score awarded
    }
    return 0; // Already activated or not lit
  };

  // Exposed methods to control lighting and reset activation
  const lightSaucer = () => {
    setIsLit(true);
  };

  const dimSaucer = () => {
    setIsLit(false);
  };

  const resetSaucer = () => {
    setIsActivated(false); // Allow re-activation
    // setIsLit(initialIsLit); // Reset lit state to initial, or keep dimmed
  };

  const getIsLit = () => isLit;

  useImperativeHandle(ref, () => ({
    handleCollision,
    getBoundingClientRect: () => {
      if (saucerRef.current) {
        return saucerRef.current.getBoundingClientRect();
      }
      return {
        x: left, y: top, width: size, height: size,
        top: top, right: left + size, bottom: top + size, left: left
      };
    },
    lightSaucer,
    dimSaucer,
    resetSaucer,
    getIsLit
  }));

  return (
    <SaucerContainer ref={saucerRef} top={top} left={left} size={size} isLit={isLit}>
      <SaucerText isLit={isLit}>Mystery</SaucerText>
    </SaucerContainer>
  );
});

MysterySaucer.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  size: PropTypes.number,
  onActivate: PropTypes.func.isRequired,
  initialIsLit: PropTypes.bool,
  scoreValue: PropTypes.number,
};

export default MysterySaucer;