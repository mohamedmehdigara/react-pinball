// src/components/Ball.js
import React, { useRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const StyledBall = styled.div`
  position: absolute;
  width: ${props => props.size * 2}px; // Diameter
  height: ${props => props.size * 2}px; // Diameter
  background-color: silver;
  border-radius: 50%;
  box-shadow: inset -3px -3px 5px rgba(0, 0, 0, 0.4),
              3px 3px 5px rgba(255, 255, 255, 0.6);
  left: ${props => props.x - props.size}px; // Adjust for center positioning
  top: ${props => props.y - props.size}px; // Adjust for center positioning
  z-index: 100; // Ensure ball is on top
`;

const Ball = React.forwardRef(({
  position, // Received as { x, y }
  radius,   // Received as a number
}, ref) => {
  const ballElementRef = useRef(null);

  // Expose getBoundingClientRect if needed, but for a perfect circle,
  // position and radius are often enough for collision in parent.
  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      if (ballElementRef.current) {
        return ballElementRef.current.getBoundingClientRect();
      }
      // Provide a sensible fallback if the ref is not attached yet
      // This is crucial to prevent "maximum call stack size exceeded" errors
      // if something tries to get the rect before render.
      return {
        x: position.x - radius,
        y: position.y - radius,
        width: radius * 2,
        height: radius * 2,
        top: position.y - radius,
        right: position.x + radius,
        bottom: position.y + radius,
        left: position.x - radius,
      };
    },
    // You might also expose the current position and radius if other components need it
    // getPosition: () => position,
    // getRadius: () => radius,
  }));

  return (
    <StyledBall
      ref={ballElementRef}
      x={position.x}
      y={position.y}
      size={radius}
    />
  );
});

Ball.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  radius: PropTypes.number.isRequired,
};

export default Ball;