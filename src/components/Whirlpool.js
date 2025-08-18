import React, { forwardRef, useImperativeHandle } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation for a gentle spin and pulsating effect
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 255, 1); }
  100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
`;

const WhirlpoolContainer = styled.div`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: radial-gradient(circle, #0077be 0%, #1a237e 100%);
  border-radius: 50%;
  border: 3px solid #0ff;
  animation: ${spin} 3s linear infinite, ${pulse} 2s ease-in-out infinite;
  z-index: 100;
  pointer-events: none;
`;

/**
 * A component representing a swirling vortex that captures and ejects the ball.
 * @param {object} props - The component props.
 * @param {number} props.x - The x-coordinate of the whirlpool's center.
 * @param {number} props.y - The y-coordinate of the whirlpool's center.
 * @param {number} props.size - The diameter of the whirlpool.
 * @param {function} props.onBallCaptured - The callback to execute when a ball enters the whirlpool.
 * @param {string} props.id - A unique identifier for the component.
 */
const Whirlpool = forwardRef(({ x, y, size, onBallCaptured, id }, ref) => {
  // Expose a method for the parent component to call
  useImperativeHandle(ref, () => ({
    // This method handles the collision with the ball.
    handleCollision: (ball) => {
      // Simple circle-on-circle collision detection
      const dx = ball.position.x - (x + size / 2);
      const dy = ball.position.y - (y + size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const combinedRadius = size / 2 + ball.radius;

      if (distance < combinedRadius) {
        onBallCaptured(id, 2000); // Trigger capture with a bonus score
        return { isCaptured: true, score: 2000 };
      }
      return { isCaptured: false };
    },
    // The parent can call this method to eject the ball with a new velocity.
    ejectBall: (ballRadius) => {
      const ejectPosition = { x: x + size / 2, y: y + size + ballRadius };
      const ejectVelocity = { x: Math.random() * 8 - 4, y: -10 }; // Random sideways kick
      return { position: ejectPosition, velocity: ejectVelocity };
    }
  }));

  return (
    <WhirlpoolContainer x={x} y={y} size={size} />
  );
});

export default Whirlpool;