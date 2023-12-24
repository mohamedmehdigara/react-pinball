import React, { useEffect, useState } from 'react';
import Ball from './Ball';  // Assuming you have a Ball component

const Multiball = ({ initialBallsCount, onBallLost, onScore }) => {
  const [balls, setBalls] = useState([]);

  useEffect(() => {
    // Initialize the multiball with the specified number of balls
    const initialBalls = Array.from({ length: initialBallsCount }, (_, index) => createBall(index));
    setBalls(initialBalls);

    // Clean up balls when the component unmounts
    return () => {
      removeAllBalls();
    };
  }, [initialBallsCount]);

  const createBall = (id) => {
    // Customize the initial position of each ball as needed
    const initialPosition = {
      x: Math.random() * 500,  // Adjust based on your game's dimensions
      y: Math.random() * 500,
    };

    return {
      id,
      position: initialPosition,
      isActive: true,
    };
  };

  const removeBall = (ballId) => {
    setBalls((prevBalls) => prevBalls.filter((ball) => ball.id !== ballId));
    onBallLost && onBallLost();
  };

  const removeAllBalls = () => {
    setBalls([]);
  };

  const handleBallHit = (ballId, score) => {
    // Handle scoring logic when a ball hits something
    onScore && onScore(score);

    // Customize additional logic based on the hit, e.g., check for special targets
  };

  return (
    <>
      {balls.map((ball) => (
        <Ball
          key={ball.id}
          id={ball.id}
          position={ball.position}
          isActive={ball.isActive}
          onHit={(score) => handleBallHit(ball.id, score)}
          onBallLost={() => removeBall(ball.id)}
        />
      ))}
    </>
  );
};

export default Multiball;
