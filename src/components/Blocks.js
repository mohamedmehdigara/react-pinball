import React, { useState } from 'react';
import styled from 'styled-components';

const BlocksContainer = styled.div`
  width: 200px;
  height: 50px;
  background-color: #777;
  position: absolute;
  top: ${(props) => `${props.top}px`};
  left: ${(props) => `${props.left}px`};
  cursor: pointer;
`;

const Blocks = ({ initialTop, initialLeft, onCollision }) => {
  const [top, setTop] = useState(initialTop);
  const [left, setLeft] = useState(initialLeft);

  const handleCollision = () => {
    // Logic for block collision
    // For example, you can move the block to a new position
    const newTop = Math.floor(Math.random() * 400); // Adjust this based on your game design
    const newLeft = Math.floor(Math.random() * 600); // Adjust this based on your game design

    setTop(newTop);
    setLeft(newLeft);

    // Notify the parent component about the collision
    onCollision();
  };

  return <BlocksContainer top={top} left={left} onClick={handleCollision} />;
};

export default Blocks;
