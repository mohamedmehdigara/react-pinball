import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for subtle glow when active/lit
const entranceGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(0, 150, 255, 0.4); }
  50% { box-shadow: 0 0 15px rgba(0, 150, 255, 0.8); }
`;

// Styled component for the Subway Entrance
const StyledSubwayEntrance = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #333; /* Dark, cavern-like opening */
  border: 3px solid #0096ff; /* Blue border to indicate interactive element */
  border-radius: 5px; /* Slightly rounded corners */
  box-sizing: border-box; /* Include padding and border in width/height */
  overflow: hidden; /* Hide anything that goes inside */
  z-index: 700; /* High z-index to ensure ball disappears beneath */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #00e6ff; /* Bright blue text */
  font-size: ${props => Math.min(props.width, props.height) / 5}px;
  text-align: center;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && css`
    animation: ${entranceGlow} 1.5s infinite alternate;
    background-color: #444; /* Slightly lighter when lit */
  `}
`;

const EntranceLabel = styled.div`
  color: white;
  font-size: 10px;
  text-shadow: 0 0 5px #00e6ff;
`;

/**
 * SubwayEntrance Component
 *
 * Represents an entry point to a hidden "subway" path in the pinball machine.
 * When the ball enters, it is "captured" and disappears.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the entrance.
 * @param {number} props.left - The left position of the entrance.
 * @param {string} props.id - A unique identifier for this SubwayEntrance instance.
 * @param {number} [props.width=60] - The width of the entrance.
 * @param {number} [props.height=30] - The height of the entrance.
 * @param {boolean} [props.initialIsLit=false] - If the entrance starts in a lit state.
 * @param {number} [props.scoreValue=500] - The points awarded when the ball enters the subway.
 * @param {number} [props.captureDelay=100] - Short delay for the ball to visually "disappear" before onEnter is called.
 * @param {function} props.onEnter - Callback when the ball successfully enters the subway. Receives (id, scoreValue).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const SubwayEntrance = forwardRef(({
  top,
  left,
  id,
  width = 60,
  height = 30,
  initialIsLit = false,
  scoreValue = 500,
  captureDelay = 100,
  onEnter,
}, ref) => {
  const [isLit, setIsLit] = useState(initialIsLit);
  const cooldownActive = useRef(false);
  const captureTimeoutRef = useRef(null);

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
     * Handles the collision of the ball with the Subway Entrance.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: () => {
      // The `onEnter` callback handles capturing the ball in Pinball.js state.
      // This component just triggers the event.
      if (cooldownActive.current) {
        return 0;
      }

      cooldownActive.current = true;
      setIsLit(true); // Visually light up on entry

      // Clear any existing timeout to prevent multiple calls
      clearTimeout(captureTimeoutRef.current);

      captureTimeoutRef.current = setTimeout(() => {
        onEnter(id, scoreValue); // Notify parent that ball entered
        // The parent is responsible for stopping the ball's movement
        // and eventually ejecting it from a SubwayExit.

        // After a short visual capture, dim the light again if it's not permanently lit
        if (!initialIsLit) {
            setIsLit(false);
        }
        // Short cooldown to prevent immediate re-triggering if physics pushes ball out then in quickly
        setTimeout(() => {
            cooldownActive.current = false;
        }, 500); // Small cooldown after "entering"
      }, captureDelay);

      return scoreValue;
    },
    // Methods to control lighting if not always lit
    lightEntrance: () => setIsLit(true),
    dimEntrance: () => setIsLit(false),
    getIsLit: () => isLit,
    resetEntrance: () => {
        setIsLit(initialIsLit);
        cooldownActive.current = false;
        clearTimeout(captureTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(captureTimeoutRef.current);
    };
  }, []);

  return (
    <StyledSubwayEntrance
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $isLit={isLit}
    >
      <EntranceLabel>SUBWAY</EntranceLabel>
    </StyledSubwayEntrance>
  );
});

// PropTypes for type checking and documentation
SubwayEntrance.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  initialIsLit: PropTypes.bool,
  scoreValue: PropTypes.number,
  captureDelay: PropTypes.number,
  onEnter: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
SubwayEntrance.displayName = 'SubwayEntrance';

export default SubwayEntrance;
