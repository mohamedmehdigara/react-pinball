import React, { forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';

// Styled component for the main lane container
const LaneContainer = styled.div`
  position: absolute;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: transparent;
  pointer-events: none;
  z-index: 50;
  border-left: ${props => props.isOutlane ? '2px solid #ff4444' : 'none'};
  border-right: ${props => props.isOutlane ? 'none' : '2px solid #44ff44'};
`;

/**
 * A component representing either an Inlane or an Outlane.
 * @param {object} props - Component props.
 * @param {number} props.x - The x-coordinate of the lane.
 * @param {number} props.y - The y-coordinate of the lane.
 * @param {number} props.width - The width of the lane.
 * @param {number} props.height - The height of the lane.
 * @param {boolean} props.isOutlane - True if it's an outlane, false for an inlane.
 * @param {function} props.onTrigger - Callback when the ball enters the lane area.
 * @param {string} props.id - A unique identifier.
 */
const InlaneOutlane = forwardRef(({ x, y, width, height, isOutlane, onTrigger, id }, ref) => {
  useImperativeHandle(ref, () => ({
    handleCollision: (ball) => {
      // Get the bounding box of the lane for collision detection
      const laneRect = { x, y, width, height };

      // Simple AABB (Axis-Aligned Bounding Box) collision check
      const hit = ball.position.x + ball.radius > laneRect.x &&
                  ball.position.x - ball.radius < laneRect.x + laneRect.width &&
                  ball.position.y + ball.radius > laneRect.y &&
                  ball.position.y - ball.radius < laneRect.y + laneRect.height;

      if (hit) {
        if (isOutlane) {
          onTrigger(id, true); // Trigger with isOutlane=true
          return { isTriggered: true, type: 'outlane' };
        } else {
          onTrigger(id, false); // Trigger with isOutlane=false
          return { isTriggered: true, type: 'inlane', score: 10000 };
        }
      }
      return { isTriggered: false };
    }
  }));

  return (
    <LaneContainer
      x={x}
      y={y}
      width={width}
      height={height}
      isOutlane={isOutlane}
    />
  );
});

export default InlaneOutlane;
