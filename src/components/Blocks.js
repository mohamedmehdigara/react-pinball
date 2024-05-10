import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const BlockContainer = styled.div`
  position: absolute;
`;

const Block = styled.div`
  width: ${(props) => props.size || '50px'};
  height: ${(props) => props.size || '50px'};
  background-color: ${(props) => (props.hit ? '#ff0000' : props.color || '#777')};
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

const Blocks = ({ id, initialTop, initialLeft, size, color, onClick, ballPosition }) => {
  const [top, setTop] = useState(initialTop || 0);
  const [left, setLeft] = useState(initialLeft || 0);
  const [hit, setHit] = useState(false);

  useEffect(() => {
    // Check if the ball hits the block
    const isHit =
      ballPosition?.x > left &&
      ballPosition?.x < left + (size || 50) &&
      ballPosition?.y > top &&
      ballPosition?.y < top + (size || 50);

    if (isHit) {
      // Change block color when hit
      setHit(true);

      // Reset the block color after a delay (simulating the effect)
      setTimeout(() => setHit(false), 500);

      // Additional logic when the block is hit, e.g., scoring, removing the block, etc.
      // You can call a callback function to handle these actions
      onClick && onClick(id);
    }
  }, [ballPosition, left, top, size, id, onClick]);

  const handleClick = () => {
    // Additional logic when the block is clicked, e.g., scoring, removing the block, etc.
    // You can call a callback function to handle these actions
    onClick && onClick(id);
  };

  return (
    <BlockContainer>
      {/* Pass down size, color, top, left, hit, and onClick props */}
      <Block size={size} color={color} top={top} left={left} hit={hit} onClick={handleClick}>
        {/* Additional content within the block if needed */}
        <span>{id}</span>
      </Block>
    </BlockContainer>
  );
};

export default Blocks;
