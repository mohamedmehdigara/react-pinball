// src/components/SubwayExit.js
import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for subtle glow when active/lit
const exitGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(255, 0, 0, 0.4); }
  50% { box-shadow: 0 0 15px rgba(255, 0, 0, 0.8); }
`;

// Styled component for the Subway Exit
const StyledSubwayExit = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #333; /* Dark, cavern-like opening */
  border: 3px solid #cc0000; /* Red border to indicate interactive element */
  border-radius: 5px; /* Slightly rounded corners */
  box-sizing: border-box; /* Include padding and border in width/height */
  overflow: hidden; /* Hide anything that goes inside */
  z-index: 700; /* High z-index to ensure ball emerges above */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #ff3333; /* Bright red text */
  font-size: ${props => Math.min(props.width, props.height) / 5}px;
  text-align: center;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && css`
    animation: ${exitGlow} 1.5s infinite alternate;
    background-color: #444; /* Slightly lighter when lit */
  `}
`;

const ExitLabel = styled.div`
  color: white;
  font-size: 10px;
  text-shadow: 0 0 5px #ff3333;
`;

/**
 * SubwayExit Component
 *
 * Represents an exit point from a hidden "subway" path in the pinball machine.
 * It's responsible for ejecting the ball back onto the playfield.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the exit.
 * @param {number} props.left - The left position of the exit.
 * @param {string} props.id - A unique identifier for this SubwayExit instance.
 * @param {number} [props.width=60] - The width of the exit.
 * @param {number} [props.height=30] - The height of the exit.
 * @param {number} [props.ejectStrength=12] - The velocity magnitude applied to the ball upon ejection.
 * @param {string} [props.ejectDirection='up'] - The primary direction of ejection ('up', 'left', 'right').
 * @param {function} props.onEject - Callback when the ball is ejected. Receives (id, newBallPosition, newBallVelocity).
 * @param {boolean} [props.initialIsLit=false] - If the exit starts in a lit state.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const SubwayExit = forwardRef(({
  top,
  left,
  id,
  width = 60,
  height = 30,
  ejectStrength = 12,
  ejectDirection = 'up',
  onEject,
  initialIsLit = false,
}, ref) => {
  const [isLit, setIsLit] = useState(initialIsLit);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Returns a bounding box, mainly for visual placement.
      // Collision detection is not typically done *with* the exit itself,
      // as the ball is placed *at* the exit.
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
     * Ejects the ball from the subway exit.
     * This method is called by the parent (Pinball.js) when it determines
     * the ball should exit the subway.
     * @param {number} ballRadius - The radius of the ball for positioning.
     */
    ejectBall: (ballRadius) => {
      setIsLit(true); // Temporarily light up on eject

      let newBallPosition = { x: left + width / 2, y: top + height / 2 };
      let newBallVelocity = { x: 0, y: 0 };

      // Determine ejection vector based on direction
      switch (ejectDirection) {
        case 'up':
          newBallPosition.y = top - ballRadius * 2;
          newBallVelocity = { x: (Math.random() - 0.5) * (ejectStrength / 4), y: -ejectStrength };
          break;
        case 'left':
          newBallPosition.x = left - ballRadius * 2;
          newBallVelocity = { x: -ejectStrength, y: (Math.random() - 0.5) * (ejectStrength / 4) };
          break;
        case 'right':
          newBallPosition.x = left + width + ballRadius * 2;
          newBallVelocity = { x: ejectStrength, y: (Math.random() - 0.5) * (ejectStrength / 4) };
          break;
        // Add 'down' if needed, though less common for an exit
        default:
          newBallPosition.y = top - ballRadius * 2;
          newBallVelocity = { x: (Math.random() - 0.5) * (ejectStrength / 4), y: -ejectStrength };
          break;
      }

      onEject(id, newBallPosition, newBallVelocity); // Notify parent of ejection

      // Dim the light after a short visual effect
      setTimeout(() => {
        setIsLit(initialIsLit);
      }, 300); // Flash for 300ms
    },
    // Methods to control lighting if not always lit
    lightExit: () => setIsLit(true),
    dimExit: () => setIsLit(false),
    getIsLit: () => isLit,
    resetExit: () => {
        setIsLit(initialIsLit);
    }
  }));

  return (
    <StyledSubwayExit
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $isLit={isLit}
    >
      <ExitLabel>EXIT</ExitLabel>
    </StyledSubwayExit>
  );
});

// PropTypes for type checking and documentation
SubwayExit.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  ejectStrength: PropTypes.number,
  ejectDirection: PropTypes.oneOf(['up', 'left', 'right', 'down']),
  onEject: PropTypes.func.isRequired,
  initialIsLit: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
SubwayExit.displayName = 'SubwayExit';

export default SubwayExit;
