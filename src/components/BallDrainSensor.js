import React, { forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled component for the BallDrainSensor area
const StyledBallDrainSensor = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: rgba(0, 0, 0, 0.4); /* Dark, semi-transparent to indicate drain */
  border-top: 3px solid #660000; /* Red border at the top to signify danger */
  box-sizing: border-box;
  z-index: 100; /* Low z-index, as it's a background element */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #ff3333; /* Red text */
  font-size: ${props => Math.min(props.width / 10, props.height / 3)}px;
  text-transform: uppercase;
  user-select: none;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;
`;

/**
 * BallDrainSensor Component
 *
 * Represents a sensor area at the bottom of the playfield that detects
 * when the ball drains, triggering end-of-ball or game over logic.
 * It's primarily a collision detection area.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the sensor area.
 * @param {number} props.left - The left position of the sensor area.
 * @param {string} props.id - A unique identifier for this sensor instance.
 * @param {number} props.width - The width of the sensor area.
 * @param {number} props.height - The height of the sensor area.
 * @param {function} props.onDrain - Callback when a ball is detected in the drain area. Receives (id).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const BallDrainSensor = forwardRef(({
  top,
  left,
  id,
  width,
  height,
  onDrain,
}, ref) => {
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
     * Triggers the drain event. This method is called by the parent (Pinball.js)
     * when it detects a collision with this sensor's area.
     */
    triggerDrain: () => {
      onDrain(id);
    },
    // No reset needed as it's a passive sensor.
  }));

  return (
    <StyledBallDrainSensor
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
    >
      Drain
    </StyledBallDrainSensor>
  );
});

// PropTypes for type checking and documentation
BallDrainSensor.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onDrain: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
BallDrainSensor.displayName = 'BallDrainSensor';

export default BallDrainSensor;
