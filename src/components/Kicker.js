import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the kick animation (a quick push)
const kickAnimation = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(5px); } /* Simulate a quick push */
  100% { transform: translateX(0); }
`;

// Styled component for the Kicker body
const StyledKicker = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #666; /* Grey for a metallic look */
  border: 2px solid #444;
  border-radius: 5px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  z-index: 600; /* Above playfield, below ball when active */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #eee;
  font-size: ${props => Math.min(props.width, props.height) / 3}px;
  user-select: none;
  overflow: hidden;

  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isKicking && css`
    animation: ${kickAnimation} 0.15s ease-out; /* Fast animation */
  `}
`;

/**
 * Kicker Component
 *
 * Represents a small kick-out mechanism on the pinball playfield that
 * provides an impulse to the ball, typically ejecting it or redirecting its path.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the kicker.
 * @param {number} props.left - The left position of the kicker.
 * @param {string} props.id - A unique identifier for this Kicker instance.
 * @param {number} [props.width=40] - The width of the kicker.
 * @param {number} [props.height=25] - The height of the kicker.
 * @param {number} [props.kickStrength=10] - The magnitude of the impulse applied to the ball.
 * @param {'left'|'right'|'up'|'down'|'up-left'|'up-right'|'down-left'|'down-right'} [props.kickDirection='right'] - The primary direction of the kick.
 * @param {number} [props.scoreValue=100] - The points awarded when the kicker is activated.
 * @param {number} [props.kickCooldown=200] - Cooldown in ms before kicker can be activated again.
 * @param {function} props.onKick - Callback when the kicker is activated. Receives (id, scoreValue, newBallVelocity).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const Kicker = forwardRef(({
  top,
  left,
  id,
  width = 40,
  height = 25,
  kickStrength = 10,
  kickDirection = 'right', // 'left', 'right', 'up', 'down', 'up-left', 'up-right', 'down-left', 'down-right'
  scoreValue = 100,
  kickCooldown = 200,
  onKick,
}, ref) => {
  const [isKicking, setIsKicking] = useState(false);
  const cooldownActive = useRef(false);
  const kickTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return the current bounding box for collision detection.
      return {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height,
        width: width,
        height: height,
        x: left,
        y: top,
      };
    },
    /**
     * Activates the kicker, applying an impulse to the ball.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    activateKicker: () => {
      if (cooldownActive.current) {
        return 0; // Kicker is on cooldown, do not activate
      }

      setIsKicking(true); // Trigger visual kick animation
      cooldownActive.current = true; // Set cooldown

      // Calculate the impulse vector based on kickDirection
      let impulseX = 0;
      let impulseY = 0;

      switch (kickDirection) {
        case 'left': impulseX = -kickStrength; break;
        case 'right': impulseX = kickStrength; break;
        case 'up': impulseY = -kickStrength; break;
        case 'down': impulseY = kickStrength; break;
        case 'up-left': impulseX = -kickStrength * 0.7; impulseY = -kickStrength * 0.7; break;
        case 'up-right': impulseX = kickStrength * 0.7; impulseY = -kickStrength * 0.7; break;
        case 'down-left': impulseX = -kickStrength * 0.7; impulseY = kickStrength * 0.7; break;
        case 'down-right': impulseX = kickStrength * 0.7; impulseY = kickStrength * 0.7; break;
        default: impulseX = kickStrength; break; // Default to right
      }

      // Notify parent of the kick, score, and the calculated impulse
      onKick(id, scoreValue, { x: impulseX, y: impulseY });

      // Reset kick animation after a short duration
      clearTimeout(kickTimeoutRef.current);
      kickTimeoutRef.current = setTimeout(() => {
        setIsKicking(false);
      }, 150); // Match animation duration

      // Apply kick cooldown
      setTimeout(() => {
        cooldownActive.current = false;
      }, kickCooldown);

      return scoreValue; // Return score awarded
    },
    // Reset method for game start
    resetKicker: () => {
        setIsKicking(false);
        cooldownActive.current = false;
        clearTimeout(kickTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(kickTimeoutRef.current);
    };
  }, []);

  return (
    <StyledKicker
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $isKicking={isKicking}
    >
      KICK
    </StyledKicker>
  );
});

// PropTypes for type checking and documentation
Kicker.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  kickStrength: PropTypes.number,
  kickDirection: PropTypes.oneOf(['left', 'right', 'up', 'down', 'up-left', 'up-right', 'down-left', 'down-right']),
  scoreValue: PropTypes.number,
  kickCooldown: PropTypes.number,
  onKick: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
Kicker.displayName = 'Kicker';

export default Kicker;
