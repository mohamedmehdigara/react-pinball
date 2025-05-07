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

      // Check for boundaries (adjust based on your canvas size)
      if (newPosition.y <= 0 || newPosition.y >= window.innerHeight) { // Assuming full window height for playfield
        // Reverse vertical velocity for bouncing off walls
        velocity.y *= -1;
      }

      // Optional additional boundary checks for walls and sides (adjust as needed)
      // ... (check for left and right boundaries and adjust velocity.x)

      // Update position in parent component (Pinball.js)
      updateBallPosition(newPosition);

      // Optional collision callback (replace with your actual logic)
      if (onCollision) {
        onCollision(newPosition); // Pass the new position for collision detection
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
  position: { x: 0, y: 0 }, // Starting position (adjust x and y as needed)
  velocity: { x: 0, y: 5 }, // Initial velocity with positive y for upward movement
  updateBallPosition: () => {},
  onCollision: null, // Replace with your actual collision handling logic (e.g., call FlipperCollisionDetector)
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

