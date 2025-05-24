// src/components/Rotor.js
import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the spinning animation
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled component for the Rotor
const StyledRotor = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%; /* Circular shape */
  background: radial-gradient(circle at 30% 30%, #ffd700, #ff8c00); /* Gold/orange gradient */
  border: 3px solid #cc7700; /* Darker orange border */
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.7); /* Orange glow */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 550; /* Above playfield, below ball */

  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  /* Inner visual elements to show spin */
  &::before, &::after {
    content: '';
    position: absolute;
    background-color: rgba(255, 255, 255, 0.3); /* White lines to make spin visible */
    border-radius: 2px;
  }
  &::before {
    width: 80%;
    height: 5px;
  }
  &::after {
    width: 5px;
    height: 80%;
  }

  ${props => props.$isSpinning && css`
    animation: ${spin} ${props.$spinDuration}s linear infinite;
  `}
`;

/**
 * Rotor Component
 *
 * Represents a spinning disc or mechanism on the pinball playfield.
 * When the ball interacts with it, it spins and can award points.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the Rotor's center.
 * @param {number} props.left - The left position of the Rotor's center.
 * @param {string} props.id - A unique identifier for this Rotor instance.
 * @param {number} [props.size=70] - The diameter of the rotor.
 * @param {number} [props.scoreValue=250] - The points awarded when the rotor is hit/activated.
 * @param {number} [props.spinDuration=0.5] - The duration of one full spin cycle in seconds when activated.
 * @param {number} [props.spinCooldown=500] - Cooldown in ms before rotor can be activated again.
 * @param {function} props.onSpin - Callback function when the rotor is activated. Receives (id, scoreValue).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const Rotor = forwardRef(({
  top,
  left,
  id,
  size = 70,
  scoreValue = 250,
  spinDuration = 0.5,
  spinCooldown = 500,
  onSpin,
}, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const cooldownActive = useRef(false);
  const spinTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Returns a bounding box for collision detection.
      // Assuming 'top' and 'left' are for the top-left corner of the rotor.
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
     * Handles the collision/interaction of the ball with the Rotor.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: () => {
      if (cooldownActive.current) {
        return 0; // Rotor is on cooldown, do not activate
      }

      setIsSpinning(true); // Start spinning animation
      cooldownActive.current = true; // Set cooldown

      onSpin(id, scoreValue); // Notify parent of activation and score

      // Stop spinning after a short duration (or let it spin for a bit)
      // Here, we let it spin indefinitely once triggered and rely on parent
      // to remove the ball. If it's a "hit" rotor, it might spin once and stop.
      // For simplicity, let's make it spin for 2 seconds then stop, unless hit again.
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => {
        setIsSpinning(false);
      }, 2000); // Spin for 2 seconds

      // Apply interaction cooldown
      setTimeout(() => {
        cooldownActive.current = false;
      }, spinCooldown);

      return scoreValue; // Return score awarded
    },
    // Optional: A method to reset the rotor's state if needed by the parent
    resetRotor: () => {
        setIsSpinning(false);
        cooldownActive.current = false;
        clearTimeout(spinTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  return (
    <StyledRotor
      ref={ref}
      top={top}
      left={left}
      size={size}
      $isSpinning={isSpinning}
      $spinDuration={spinDuration}
    />
  );
});

// PropTypes for type checking and documentation
Rotor.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  scoreValue: PropTypes.number,
  spinDuration: PropTypes.number,
  spinCooldown: PropTypes.number,
  onSpin: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
Rotor.displayName = 'Rotor';

export default Rotor;
