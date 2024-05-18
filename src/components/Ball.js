import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Ball = ({ position, velocity, updateBallPosition, onCollision }) => {
  const ballRef = useRef(null); // Create a ref for the ball element

  // Update ball position on every render (assuming constant velocity)
  useEffect(() => {
    if (ballRef.current) {
      const newPosition = {
        x: position.x + velocity.x,
        y: position.y + velocity.y,
      };

      // Check boundaries (optional, adjust based on your canvas size)
      if (newPosition.x < 0) {
        newPosition.x = 0;
        velocity.x = -velocity.x; // Reverse x-velocity on collision
      } else if (newPosition.x > window.innerWidth - ballRef.current.clientWidth) {
        newPosition.x = window.innerWidth - ballRef.current.clientWidth;
        velocity.x = -velocity.x; // Reverse x-velocity on collision
      }

      if (newPosition.y < 0) {
        newPosition.y = 0;
        velocity.y = -velocity.y; // Reverse y-velocity on collision (top)
      } else if (newPosition.y > window.innerHeight - ballRef.current.clientHeight) {
        newPosition.y = window.innerHeight - ballRef.current.clientHeight;
        velocity.y = -velocity.y; // Reverse y-velocity on collision (bottom)
      }

      // Update position
      updateBallPosition(newPosition);

      // Optional collision callback
      if (onCollision) {
        onCollision(newPosition); // Call the provided collision callback
      }
    }
  }, [position, velocity]); // Re-run on position, velocity, or updateBallPosition change

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
  updateBallPosition: () => {}, // Empty function for optional updates
  onCollision: null, // Optional collision callback
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
  updateBallPosition: PropTypes.func, // Optional update function
  onCollision: PropTypes.func, // Optional collision callback
};

export default Ball;
