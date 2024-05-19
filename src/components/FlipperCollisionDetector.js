import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const FlipperCollisionDetector = ({ ballPosition, ballVelocity, flipperPositions, onCollision }) => {
  const collisionRef = useRef(false);

  useEffect(() => {
    if (ballPosition && ballVelocity && !collisionRef.current) {
      // Existing collision detection logic (replace with your actual implementation if needed)
      const ballRadius = 10; // Replace with your actual ball radius
      const flipperWidth = 20; // Replace with your actual flipper width
      const flipperHeight = 50; // Replace with your actual flipper height

      let collisionDetected = false;

      for (const flipper of flipperPositions) {
        const distanceX = Math.abs(ballPosition.x - flipper.x);
        const distanceY = Math.abs(ballPosition.y - flipper.y);

        if (distanceX < flipperWidth / 2 && distanceY < flipperHeight) {
          collisionDetected = true;
          break; // Exit loop after first collision
        }
      }

      if (collisionDetected) {
        collisionRef.current = true;
        onCollision(); // Call the provided collision callback
      }
    }
  }, [ballPosition, ballVelocity]);

  return null;
};

FlipperCollisionDetector.propTypes = {
  ballPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  ballVelocity: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  flipperPositions: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  })).isRequired,
  onCollision: PropTypes.func.isRequired,
};

export default FlipperCollisionDetector;
