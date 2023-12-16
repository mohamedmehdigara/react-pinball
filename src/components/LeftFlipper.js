import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FlipperBase = styled.div`
  width: 160px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
`;

const LeftFlipperStyled = styled(FlipperBase)`
  transform-origin: left center;
  transform: rotate(${(props) => (props.up ? '-30deg' : '0deg')});
  left: 50px;
  cursor: pointer;
`;

const LeftFlipper = ({ up, onFlip }) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (up) {
      // Logic for lifting the flipper
      setRotation(-30);
    } else {
      // Logic for lowering the flipper
      setRotation(0);
    }
  }, [up]);

  useEffect(() => {
    // Additional logic for flipper movement or animations
    // You can add more animations or adjust the flipper's behavior here
  }, [rotation]);

  return <LeftFlipperStyled up={up} style={{ transform: `rotate(${rotation}deg)` }} onClick={onFlip} />;
};

export default LeftFlipper;
