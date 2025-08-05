import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import PropTypes from 'prop-types';

// Simple styled component for the mini-ball
const StyledMiniBall = styled.div`
  position: absolute;
  width: ${props => props.size * 2}px;
  height: ${props => props.size * 2}px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, #555);
  box-shadow: inset -2px -2px 5px rgba(0, 0, 0, 0.5),
              0 0 10px rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  z-index: 200;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
`;

// Styled component for the mini-bumper
const miniBumperHit = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 5px rgba(0,255,255,0.8); }
  50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(0,255,255,1); }
  100% { transform: scale(1); box-shadow: 0 0 5px rgba(0,255,255,0.8); }
`;

const StyledMiniBumper = styled.div`
  position: absolute;
  width: ${props => props.size * 2}px;
  height: ${props => props.size * 2}px;
  background: radial-gradient(circle, #00ffff, #007777);
  border-radius: 50%;
  border: 2px solid #00cccc;
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.8);
  cursor: pointer;
  z-index: 210;
  
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  transform: translate(-50%, -50%);

  ${props => props.isHit && css`
    animation: ${miniBumperHit} 0.2s linear;
  `}
`;

// Main container for the MiniPlayfield
const StyledMiniPlayfield = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  background-color: #111;
  border: 4px solid #ccaa00;
  border-radius: 10px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5),
              0 0 20px rgba(204, 170, 0, 0.7);
  overflow: hidden;
  z-index: 150;
`;

// MiniPlayfield Component
const MiniPlayfield = forwardRef(({
  id,
  top,
  left,
  width,
  height,
  onExit,
  scoreCallback,
}, ref) => {
  // Mini-ball state
  const [isActive, setIsActive] = useState(false);
  const [miniBallPosition, setMiniBallPosition] = useState({ x: 0, y: 0 });
  const miniBallVelocityRef = useRef({ x: 0, y: 0 });
  const miniBallRadius = 5;

  // Mini-Bumper State
  const [isMiniBumperHit, setIsMiniBumperHit] = useState(false);
  const miniBumperRef = useRef(null);
  const miniBumperCooldown = useRef(0);

  // Physics constants for the mini-game
  const MINI_GRAVITY = 0.05;
  const MINI_FRICTION = 0.99;
  const MINI_WALL_BOUNCE = 0.8;
  const MINI_BUMPER_IMPULSE = 5;
  const MINI_BUMPER_SCORE = 50;

  // Function to activate the mini-game from the parent component
  const activate = useCallback((initialBallPosition, initialBallVelocity) => {
    // Position the mini-ball relative to the mini-playfield's coordinates
    const miniBallX = initialBallPosition.x - left;
    const miniBallY = initialBallPosition.y - top;
    setMiniBallPosition({ x: miniBallX, y: miniBallY });

    // Transfer the ball's velocity and scale it for the mini-game
    miniBallVelocityRef.current = {
      x: initialBallVelocity.x * 0.5,
      y: initialBallVelocity.y * 0.5,
    };
    
    setIsActive(true);
  }, [top, left]);

  // Function to deactivate and exit the mini-game
  const deactivate = useCallback(() => {
    setIsActive(false);
    onExit({ x: left, y: top }, { x: 0, y: 15 }); // Pass exit velocity to parent
  }, [onExit, left, top]);

  // Expose public methods via ref
  useImperativeHandle(ref, () => ({
    // Method for the parent to check if a ball has entered the entrance area
    checkEntranceCollision: (ballPosition, radius) => {
      // Create a bounding box for the mini-playfield entrance
      const entranceRect = {
        left: left,
        top: top + height - 20, // A small strip at the bottom
        right: left + width,
        bottom: top + height,
      };

      const circle = { x: ballPosition.x, y: ballPosition.y, radius: radius };

      const closestX = Math.max(entranceRect.left, Math.min(circle.x, entranceRect.right));
      const closestY = Math.max(entranceRect.top, Math.min(circle.y, entranceRect.bottom));
      const distanceX = circle.x - closestX;
      const distanceY = circle.y - closestY;
      const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
      
      return distanceSquared < (circle.radius * circle.radius);
    },
    // The main entry point for the parent to activate the mini-game
    activate,
    // Method to check if the mini-game is currently active
    getIsActive: () => isActive,
  }), [isActive, activate, left, top, width, height]);

  // Mini-game loop
  useEffect(() => {
    let animationFrameId;

    const miniGameLoop = () => {
      // Update mini-ball velocity with gravity and friction
      miniBallVelocityRef.current.y += MINI_GRAVITY;
      miniBallVelocityRef.current.x *= MINI_FRICTION;
      miniBallVelocityRef.current.y *= MINI_FRICTION;
      
      let nextPos = {
        x: miniBallPosition.x + miniBallVelocityRef.current.x,
        y: miniBallPosition.y + miniBallVelocityRef.current.y,
      };

      // Collision with mini-playfield walls
      if (nextPos.x - miniBallRadius < 0 || nextPos.x + miniBallRadius > width) {
        miniBallVelocityRef.current.x *= -MINI_WALL_BOUNCE;
        nextPos.x = nextPos.x - miniBallRadius < 0 ? miniBallRadius : width - miniBallRadius;
      }
      if (nextPos.y - miniBallRadius < 0) {
        miniBallVelocityRef.current.y *= -MINI_WALL_BOUNCE;
        nextPos.y = miniBallRadius;
      }

      // Check for mini-ball drain
      if (nextPos.y + miniBallRadius > height) {
        deactivate();
        return;
      }

      // Mini-Bumper collision detection
      if (miniBumperCooldown.current <= 0) {
        const bumperRect = miniBumperRef.current.getBoundingClientRect();
        // The bumper position is relative to the viewport, so we need to adjust
        const bumperX = bumperRect.x - left + bumperRect.width / 2;
        const bumperY = bumperRect.y - top + bumperRect.height / 2;
        const bumperRadius = bumperRect.width / 2;
        
        const distance = Math.hypot(nextPos.x - bumperX, nextPos.y - bumperY);
        if (distance < miniBallRadius + bumperRadius) {
          setIsMiniBumperHit(true);
          scoreCallback(MINI_BUMPER_SCORE);
          
          // Calculate bounce impulse
          const normalX = (nextPos.x - bumperX) / distance;
          const normalY = (nextPos.y - bumperY) / distance;
          const dotProduct = miniBallVelocityRef.current.x * normalX + miniBallVelocityRef.current.y * normalY;

          miniBallVelocityRef.current.x = normalX * MINI_BUMPER_IMPULSE;
          miniBallVelocityRef.current.y = normalY * MINI_BUMPER_IMPULSE;
          miniBumperCooldown.current = 10; // Set cooldown
        }
      } else {
        miniBumperCooldown.current--;
        if (miniBumperCooldown.current === 0) {
          setIsMiniBumperHit(false);
        }
      }

      setMiniBallPosition(nextPos);
      animationFrameId = requestAnimationFrame(miniGameLoop);
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(miniGameLoop);
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, miniBallPosition, width, height, deactivate, left, top, scoreCallback]);

  return (
    <StyledMiniPlayfield top={top} left={left} width={width} height={height}>
      {/* Render mini-game elements only when active */}
      {isActive && (
        <>
          <StyledMiniBall x={miniBallPosition.x} y={miniBallPosition.y} size={miniBallRadius} />
          <StyledMiniBumper
            ref={miniBumperRef}
            x={width / 2}
            y={height / 2}
            size={15}
            isHit={isMiniBumperHit}
          />
        </>
      )}
    </StyledMiniPlayfield>
  );
});

// PropTypes for type checking and documentation
MiniPlayfield.propTypes = {
  id: PropTypes.string.isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onExit: PropTypes.func.isRequired,
  scoreCallback: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
MiniPlayfield.displayName = 'MiniPlayfield';

export default MiniPlayfield;
