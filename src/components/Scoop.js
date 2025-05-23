// src/components/Scoop.js
import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the light effect when active
const scoopGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 102, 0, 0.6); }
  50% { box-shadow: 0 0 25px rgba(255, 102, 0, 1); }
`;

// Styled component for the Scoop
const StyledScoop = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: #444; /* Dark background for the hole */
  border-radius: 50%; /* Circular shape */
  border: 2px solid #ff6600; /* Orange border */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #ffaa00; /* Orange text */
  font-size: ${props => props.size / 5}px;
  text-align: center;
  line-height: 1.2;
  overflow: hidden; /* Ensures ball appears to go into the hole */
  z-index: 700; /* High z-index to be above ball when captured */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.isActive && css`
    animation: ${scoopGlow} 1s infinite alternate;
    background-color: #666; /* Slightly lighter when active */
  `}
`;

/**
 * Scoop Component
 *
 * Represents a generic hole or saucer on the pinball playfield that captures
 * the ball and then ejects it, typically triggering a game mode or awarding points.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the Scoop's center.
 * @param {number} props.left - The left position of the Scoop's center.
 * @param {string} props.id - A unique identifier for this Scoop instance.
 * @param {number} [props.size=60] - The diameter of the Scoop hole.
 * @param {number} [props.ejectStrength=10] - The velocity magnitude applied to the ball upon ejection.
 * @param {number} [props.captureDelay=700] - The delay in milliseconds before the ball is ejected.
 * @param {number} [props.scoreValue=750] - The points awarded when the Scoop is activated.
 * @param {function} props.onCapture - Callback when the ball enters the Scoop. Receives (scoopId).
 * @param {function} props.onEject - Callback when the ball is ejected. Receives (scoopId, newBallPosition, newBallVelocity).
 * @param {boolean} [props.initialIsLit=false] - If the scoop starts in a lit state.
 * @param {React.Ref} ref - Ref for accessing DOM element or imperative handles.
 */
const Scoop = forwardRef(({
  top,
  left,
  id,
  size = 60,
  ejectStrength = 10,
  captureDelay = 700,
  scoreValue = 750,
  onCapture,
  onEject,
  initialIsLit = false,
}, ref) => {
  const [isActive, setIsActive] = useState(initialIsLit); // Can start lit or not
  const cooldownActive = useRef(false);
  const ejectTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return a bounding box for collision detection.
      return {
        left: left,
        top: top,
        right: left + size,
        bottom: top + size,
        width: size,
        height: size,
        x: left,
        y: top,
      };
    },
    /**
     * Handles the collision of the ball with the Scoop.
     * @param {object} ballPosition - The current position of the ball.
     * @param {number} ballRadius - The radius of the ball.
     * @returns {number} The score awarded, or 0 if on cooldown or not lit.
     */
    handleCollision: (ballPosition, ballRadius) => {
      // Only activate if not on cooldown and is lit (if applicable)
      if (cooldownActive.current || (initialIsLit && !isActive)) {
        return 0;
      }

      setIsActive(true); // Visually activate the Scoop
      cooldownActive.current = true; // Set cooldown

      onCapture(id); // Notify parent that ball is captured

      // Clear any existing timeout to prevent multiple ejects
      clearTimeout(ejectTimeoutRef.current);

      // Schedule the ball ejection
      ejectTimeoutRef.current = setTimeout(() => {
        // Calculate new ball position (just above the Scoop, or slightly offset)
        const newBallPosition = {
          x: left + size / 2 + (Math.random() - 0.5) * 10, // Center horizontally with slight randomness
          y: top - ballRadius * 2, // Eject above the Scoop
        };
        // Define new ball velocity (outward kick)
        const newBallVelocity = {
          x: (Math.random() - 0.5) * ejectStrength, // Random horizontal component
          y: -ejectStrength, // Upward velocity
        };

        onEject(id, newBallPosition, newBallVelocity); // Notify parent of ejection
        setIsActive(initialIsLit); // Reset visual state to initial lit state

        // Reset cooldown after a short period to allow re-activation
        setTimeout(() => {
          cooldownActive.current = false;
        }, 500); // Cooldown after ejection
      }, captureDelay);

      return scoreValue; // Award score immediately upon activation
    },
    // Method for parent to explicitly reset the Scoop's state
    resetScoop: () => {
        setIsActive(initialIsLit);
        cooldownActive.current = false;
        clearTimeout(ejectTimeoutRef.current);
    },
    // Methods to control lighting if not always lit
    lightScoop: () => setIsActive(true),
    dimScoop: () => setIsActive(false),
    getIsLit: () => isActive,
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(ejectTimeoutRef.current);
    };
  }, []);

  return (
    <StyledScoop
      ref={ref}
      size={size}
      top={top}
      left={left}
      isActive={isActive}
    >
      SCOOP
    </StyledScoop>
  );
});

// PropTypes for type checking and documentation
Scoop.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  ejectStrength: PropTypes.number,
  captureDelay: PropTypes.number,
  scoreValue: PropTypes.number,
  onCapture: PropTypes.func.isRequired,
  onEject: PropTypes.func.isRequired,
  initialIsLit: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
Scoop.displayName = 'Scoop';

export default Scoop;
