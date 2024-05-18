import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Ball = ({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 }, updateBallPosition }) => {
  const ballRef = useRef(null); // Create a ref for the ball element

  // Update ball position on every render (assuming constant velocity)
  useEffect(() => {
    if (ballRef.current) {
      const newPosition = {
        x: position.x + velocity.x,
        y: position.y + velocity.y,
      };
      updateBallPosition(newPosition); // Call the provided callback
    }
  }, [position, velocity, updateBallPosition]); // Re-run on position, velocity, or updateBallPosition change

  return (
    <div
      ref={ballRef} // Assign the ref to the ball element
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '20px',
        height: '20px',
        backgroundColor: 'red',
        borderRadius: '50%',
        transition: 'transform 0.1s ease-in-out', // Smooth movement
      }}
    />
  );
};

Ball.defaultProps = {
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
};

Ball.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  velocity: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  updateBallPosition: PropTypes.func.isRequired,
};

export default Ball;
