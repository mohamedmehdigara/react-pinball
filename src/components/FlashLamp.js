import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the intense flash animation
const intenseFlash = keyframes`
  0%, 100% { opacity: 0; } /* Start/end dim or off */
  10%, 30%, 50%, 70%, 90% { opacity: 1; } /* Bright flashes */
  20%, 40%, 60%, 80% { opacity: 0.2; } /* Brief dimming between flashes */
`;

// Styled component for the Flash Lamp
const StyledFlashLamp = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.$flashColor};
  border-radius: 50%; /* Circular lamp */
  border: 2px solid ${props => props.$borderColor};
  box-shadow: 0 0 10px ${props => props.$borderColor}, 0 0 20px ${props => props.$borderColor}; /* Base glow */
  z-index: 800; /* High z-index for visual impact, above most elements */
  opacity: 0; /* Default to off unless actively flashing */
  pointer-events: none; /* Make it non-interactive for mouse events */

  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isFlashing && css`
    animation: ${intenseFlash} ${props.$flashDuration}s linear infinite;
  `}
`;

/**
 * FlashLamp Component
 *
 * Represents a high-intensity, customizable flashing light on the playfield
 * used for special effects, alerts, or game state indicators.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the lamp's center.
 * @param {number} props.left - The left position of the lamp's center.
 * @param {string} props.id - A unique identifier for this lamp instance.
 * @param {number} [props.size=30] - The diameter of the lamp.
 * @param {string} [props.flashColor='#ff0000'] - The color of the light when it flashes.
 * @param {string} [props.borderColor='#cc0000'] - The border/base glow color.
 * @param {number} [props.flashDuration=1.0] - The duration of one full flash cycle in seconds.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const FlashLamp = forwardRef(({
  top,
  left,
  id,
  size = 30,
  flashColor = '#ff0000', // Bright Red
  borderColor = '#cc0000', // Darker Red
  flashDuration = 1.0,
}, ref) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    /**
     * Starts the flashing animation for a specified duration.
     * If duration is 0 or not provided, it flashes indefinitely until `stopFlash` is called.
     * @param {number} duration - How long to flash in milliseconds.
     */
    startFlash: (duration = 0) => {
      setIsFlashing(true);
      // If a duration is provided, stop flashing after that time
      if (duration > 0) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => {
          setIsFlashing(false);
        }, duration);
      }
    },
    /**
     * Stops the flashing animation.
     */
    stopFlash: () => {
      setIsFlashing(false);
      clearTimeout(flashTimeoutRef.current);
    },
    getIsFlashing: () => isFlashing,
    // Reset method for game start (ensure it's off)
    resetLamp: () => {
        setIsFlashing(false);
        clearTimeout(flashTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  return (
    <StyledFlashLamp
      ref={ref}
      top={top - size / 2} /* Adjust to center based on top/left props */
      left={left - size / 2} /* Adjust to center based on top/left props */
      size={size}
      $flashColor={flashColor}
      $borderColor={borderColor}
      $isFlashing={isFlashing}
      $flashDuration={flashDuration}
    />
  );
});

// PropTypes for type checking and documentation
FlashLamp.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  flashColor: PropTypes.string,
  borderColor: PropTypes.string,
  flashDuration: PropTypes.number,
};

// Set a display name for easier debugging in React DevTools
FlashLamp.displayName = 'FlashLamp';

export default FlashLamp;
