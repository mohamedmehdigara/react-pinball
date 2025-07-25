import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a subtle glow when a rollover point is lit
const pointGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.4); }
  50% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.8); }
`;

// Styled component for the RolloverLane container
const StyledRolloverLane = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: rgba(0, 0, 0, 0.2); /* Transparent background for the lane area */
  border: 1px dashed #777; /* Dashed border to define the lane */
  border-radius: 5px;
  display: flex;
  flex-direction: ${props => props.$orientation === 'vertical' ? 'column' : 'row'};
  justify-content: space-around; /* Distribute rollover points evenly */
  align-items: center;
  padding: 5px;
  box-sizing: border-box;
  z-index: 300; /* Below ball, above playfield */

  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;
`;

// Styled component for an individual Rollover Point (the light/sensor)
const StyledRolloverPoint = styled.div`
  width: ${props => props.$pointSize}px;
  height: ${props => props.$pointSize}px;
  background-color: ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border: 1px solid ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border-radius: 50%; /* Circular light */
  opacity: ${props => props.$isLit ? 1 : 0.4};
  transition: background-color 0.1s ease-in-out, opacity 0.1s ease-in-out;
  cursor: pointer; /* Indicate it's interactive (for debugging/testing) */

  ${props => props.$isLit && css`
    animation: ${pointGlow} 1.5s infinite alternate;
  `}
`;

/**
 * RolloverLane Component
 *
 * Represents a lane with multiple rollover switches. When the ball passes
 * over a switch, it lights up. Completing all switches in the lane can
 * trigger bonuses or advance game features.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the lane container.
 * @param {number} props.left - The left position of the lane container.
 * @param {string} props.id - A unique identifier for this RolloverLane instance.
 * @param {number} props.width - The width of the lane.
 * @param {number} props.height - The height of the lane.
 * @param {number} props.numPoints - The number of individual rollover points in the lane.
 * @param {'horizontal'|'vertical'} [props.orientation='horizontal'] - Layout of points.
 * @param {number} [props.pointSize=15] - The diameter of each rollover point.
 * @param {string} [props.litColor='#00ffff'] - Color when a point is lit.
 * @param {string} [props.dimColor='#003333'] - Color when a point is dim.
 * @param {number} [props.scorePerPoint=50] - Points awarded for lighting one point.
 * @param {number} [props.laneClearBonus=1000] - Bonus for lighting all points.
 * @param {function} props.onPointLit - Callback when an individual point is lit. Receives (laneId, pointIndex, score).
 * @param {function} props.onLaneCleared - Callback when all points in the lane are lit. Receives (laneId, laneClearBonus).
 * @param {boolean} [props.initialPointsLit=[]] - Array of booleans indicating initial lit state for each point.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const RolloverLane = forwardRef(({
  top,
  left,
  id,
  width,
  height,
  numPoints,
  orientation = 'horizontal',
  pointSize = 15,
  litColor = '#00ffff', // Cyan
  dimColor = '#003333',
  scorePerPoint = 50,
  laneClearBonus = 1000,
  onPointLit,
  onLaneCleared,
  initialPointsLit = [],
}, ref) => {
  // Initialize lit states for each point
  const [pointsLit, setPointsLit] = useState(() => {
    const initialState = Array(numPoints).fill(false);
    initialPointsLit.forEach((isLit, index) => {
      if (index < numPoints) initialState[index] = isLit;
    });
    return initialState;
  });

  const cooldowns = useRef(Array(numPoints).fill(false)); // Cooldown for each point
  const hitTimeoutRefs = useRef(Array(numPoints).fill(null));

  const checkLaneCleared = useCallback(() => {
    const allLit = pointsLit.every(isLit => isLit);
    if (allLit) {
      onLaneCleared(id, laneClearBonus);
    }
  }, [pointsLit, id, laneClearBonus, onLaneCleared]);

  useEffect(() => {
    checkLaneCleared();
  }, [pointsLit, checkLaneCleared]);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return the bounding box of the entire lane for collision detection
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
     * Handles the collision of the ball within the Rollover Lane.
     * This method needs to determine which specific point was hit.
     * @param {object} ballPosition - The current position of the ball.
     * @param {number} ballRadius - The radius of the ball.
     * @returns {number} The score awarded for the hit point, or 0.
     */
    handleCollision: (ballPosition, ballRadius) => {
      // Determine which point was hit based on ball's position relative to the lane
      // This is a simplified approach. For precise detection, each point would need its own precise bounds.
      // Here, we divide the lane into `numPoints` segments.

      const laneRect = { left, top, width, height };
      const relativeX = ballPosition.x - laneRect.left;
      const relativeY = ballPosition.y - laneRect.top;

      let hitIndex = -1;

      if (orientation === 'horizontal') {
        const segmentWidth = laneRect.width / numPoints;
        hitIndex = Math.floor(relativeX / segmentWidth);
      } else { // vertical
        const segmentHeight = laneRect.height / numPoints;
        hitIndex = Math.floor(relativeY / segmentHeight);
      }

      // Ensure hitIndex is within valid range
      if (hitIndex < 0 || hitIndex >= numPoints) {
        return 0;
      }

      // Check cooldown for this specific point
      if (cooldowns.current[hitIndex]) {
        return 0;
      }

      // Light the point if it's not already lit
      if (!pointsLit[hitIndex]) {
        setPointsLit(prev => {
          const newPointsLit = [...prev];
          newPointsLit[hitIndex] = true;
          return newPointsLit;
        });
        onPointLit(id, hitIndex, scorePerPoint); // Notify parent
        cooldowns.current[hitIndex] = true; // Activate cooldown for this point

        // Clear existing timeout for this point
        clearTimeout(hitTimeoutRefs.current[hitIndex]);
        hitTimeoutRefs.current[hitIndex] = setTimeout(() => {
          cooldowns.current[hitIndex] = false; // Reset cooldown
        }, 100); // Short cooldown to prevent multiple hits from one pass
        return scorePerPoint;
      }
      return 0; // Point already lit or on cooldown
    },
    /**
     * Resets all rollover points in the lane to their dim state.
     */
    resetLane: () => {
      setPointsLit(Array(numPoints).fill(false));
      cooldowns.current = Array(numPoints).fill(false);
      hitTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      hitTimeoutRefs.current = Array(numPoints).fill(null);
    },
    getPointsLit: () => pointsLit,
  }));

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      hitTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  return (
    <StyledRolloverLane
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $orientation={orientation}
    >
      {Array.from({ length: numPoints }).map((_, index) => (
        <StyledRolloverPoint
          key={index}
          $pointSize={pointSize}
          $isLit={pointsLit[index]}
          $litColor={litColor}
          $dimColor={dimColor}
          onClick={() => { // For debugging/manual testing
            if (!pointsLit[index]) {
              setPointsLit(prev => {
                const newPointsLit = [...prev];
                newPointsLit[index] = true;
                return newPointsLit;
              });
              onPointLit(id, index, scorePerPoint);
            }
          }}
        />
      ))}
    </StyledRolloverLane>
  );
});

// PropTypes for type checking and documentation
RolloverLane.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  numPoints: PropTypes.number.isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  pointSize: PropTypes.number,
  litColor: PropTypes.string,
  dimColor: PropTypes.string,
  scorePerPoint: PropTypes.number,
  laneClearBonus: PropTypes.number,
  onPointLit: PropTypes.func.isRequired,
  onLaneCleared: PropTypes.func.isRequired,
  initialPointsLit: PropTypes.arrayOf(PropTypes.bool),
};

// Set a display name for easier debugging in React DevTools
RolloverLane.displayName = 'RolloverLane';

export default RolloverLane;
