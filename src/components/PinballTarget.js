import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const TargetContainer = styled.div`
  position: absolute;
`;

const Target = styled.div`
  width: ${(props) => props.size || '50px'};
  height: ${(props) => props.size || '50px'};
  background-color: ${(props) => (props.hit ? '#ff0000' : '#777')};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.5s ease;
  border-radius: 8px; /* Add rounded corners for a more realistic appearance */
  border: 2px solid #000; /* Add a border for better visibility */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
`;

const PinballTarget = ({ id, size, initialTop, initialLeft, onClick, ballPosition }) => {
  const [top, setTop] = useState(initialTop || 0);
  const [left, setLeft] = useState(initialLeft || 0);
  const [hit, setHit] = useState(false);

  useEffect(() => {
    // Check if the ball hits the target
    const isHit =
      ballPosition?.x > left &&
      ballPosition?.x < left + (size || 50) &&
      ballPosition?.y > top &&
      ballPosition?.y < top + (size || 50);

    if (isHit) {
      // Change target color when hit
      setHit(true);

      // Reset the target color after a delay (simulating the effect)
      setTimeout(() => setHit(false), 500);

      // Additional logic when the target is hit, e.g., scoring, removing the target, etc.
      // You can call a callback function to handle these actions
      onClick && onClick(id);
    }
  }, [ballPosition, left, top, size, id, onClick]);

  const handleClick = () => {
    // Additional logic when the target is clicked, e.g., scoring, removing the target, etc.
    // You can call a callback function to handle these actions
    onClick && onClick(id);
  };

  return (
    <TargetContainer>
      {/* Pass down size, top, left, hit, and onClick props */}
      <Target size={size} top={top} left={left} hit={hit} onClick={handleClick}>
        {/* Additional content within the target if needed */}
        <span>{id}</span>
      </Target>
    </TargetContainer>
  );
};

export default PinballTarget;
