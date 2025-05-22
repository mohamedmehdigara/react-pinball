import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the light effect when active
const glow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.6); }
  50% { box-shadow: 0 0 25px rgba(0, 255, 255, 1); }
`;

// Styled component for the VUK (Vertical Up Kicker)
const StyledVUK = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: #333333; /* Dark color for the hole */
  border-radius: 50%; /* Circular shape */
  border: 2px solid #00cccc; /* Cyan border */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #00ffff; /* Cyan text */
  font-size: ${props => props.size / 5}px;
  text-align: center;
  line-height: 1.2;
  overflow: hidden; /* Ensures ball appears to go into the hole */
  z-index: 700; /* High z-index to be above ball when captured */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.isActive && css`
    animation: ${glow} 1s infinite alternate;
    background-color: #555555; /* Slightly lighter when active */
  `}
`;

/**
 * VUK (Vertical Up Kicker) Component
 *
 * Represents a mechanism in a pinball game that captures a ball and then
 * launches it vertically upwards.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the VUK's center.
 * @param {number} props.left - The left position of the VUK's center.
 * @param {number} [props.size=50] - The diameter of the VUK hole.
 * @param {number} [props.ejectStrength=15] - The vertical velocity applied to the ball upon ejection.
 * @param {number} [props.captureDelay=500] - The delay in milliseconds before the ball is ejected.
 * @param {number} [props.scoreValue=500] - The points awarded when the VUK is activated.
 * @param {function} props.onCapture - Callback when the ball enters the VUK. Receives (vukId).
 * @param {function} props.onEject - Callback when the ball is ejected. Receives (vukId, newBallPosition, newBallVelocity).
 * @param {string} props.id - A unique identifier for this VUK instance.
 * @param {React.Ref} ref - Ref for accessing DOM element or imperative handles.
 */
const VUK = forwardRef(({
  top,
  left,
  size = 50,
  ejectStrength = 15,
  captureDelay = 500,
  scoreValue = 500,
  onCapture,
  onEject,
  id,
}, ref) => {
  const [isActive, setIsActive] = useState(false);
  const cooldownActive = useRef(false);
  const ejectTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return a bounding box for collision detection.
      // This is the area where the ball is considered "captured" by the VUK.
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
     * Handles the collision of the ball with the VUK.
     * @param {object} ballPosition - The current position of the ball.
     * @param {number} ballRadius - The radius of the ball.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: (ballPosition, ballRadius) => {
      if (cooldownActive.current) {
        return 0; // VUK is on cooldown, do not activate
      }

      setIsActive(true); // Visually activate the VUK
      cooldownActive.current = true; // Set cooldown

      onCapture(id); // Notify parent that ball is captured

      // Clear any existing timeout to prevent multiple ejects
      clearTimeout(ejectTimeoutRef.current);

      // Schedule the ball ejection
      ejectTimeoutRef.current = setTimeout(() => {
        // Calculate new ball position (just above the VUK)
        const newBallPosition = {
          x: left + size / 2, // Center horizontally
          y: top - ballRadius * 2, // Eject above the VUK
        };
        // Define new ball velocity (strong upward kick)
        const newBallVelocity = {
          x: (Math.random() - 0.5) * 2, // Small random horizontal component
          y: -ejectStrength, // Strong upward velocity
        };

        onEject(id, newBallPosition, newBallVelocity); // Notify parent of ejection
        setIsActive(false); // Deactivate visual state

        // Reset cooldown after a short period to allow re-activation
        setTimeout(() => {
          cooldownActive.current = false;
        }, 500); // Cooldown after ejection
      }, captureDelay);

      return scoreValue; // Award score immediately upon activation
    },
    // Optional: A method to reset the VUK's state if needed by the parent
    resetVUK: () => {
        setIsActive(false);
        cooldownActive.current = false;
        clearTimeout(ejectTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(ejectTimeoutRef.current);
    };
  }, []);

  return (
    <StyledVUK
      ref={ref}
      size={size}
      top={top}
      left={left}
      isActive={isActive}
    >
      VUK
    </StyledVUK>
  );
});

// PropTypes for type checking and documentation
VUK.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  size: PropTypes.number,
  ejectStrength: PropTypes.number,
  captureDelay: PropTypes.number,
  scoreValue: PropTypes.number,
  onCapture: PropTypes.func.isRequired,
  onEject: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

// Set a display name for easier debugging in React DevTools
VUK.displayName = 'VUK';

export default VUK;
