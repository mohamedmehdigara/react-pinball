import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const TubeContainer = styled.div`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const TubeBody = styled.div`
  width: 60%;
  height: 100%;
  background: linear-gradient(to right, #555, #444); /* Metallic gradient */
  border-radius: 5px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4) inset,
              -1px -1px 3px rgba(255, 255, 255, 0.1) inset;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 10%;
    width: 20%;
    height: 10%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    filter: blur(1px);
  }
`;

const TubeEntrance = styled.div`
  position: absolute;
  top: ${props => props.type === 'top' ? '-15px' : 'auto'};
  bottom: ${props => props.type === 'bottom' ? '-15px' : 'auto'};
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 20px;
  background: linear-gradient(to bottom, #666, #444);
  border-radius: 3px;
  border: 1px solid #333;
  z-index: 1; /* Ensure it's on top of the body */
`;

const Tube = ({ type, x, y, width, height, onEntrance }) => {
  const handleMouseEnter = () => {
    if (onEntrance) {
      onEntrance(x, y, width, height);
    }
  };

  return (
    <TubeContainer x={x} y={y} width={width} height={height} type={type} onMouseEnter={handleMouseEnter}>
      <TubeEntrance type={type} />
      <TubeBody />
    </TubeContainer>
  );
};

Tube.propTypes = {
  type: PropTypes.oneOf(['top', 'bottom', 'vertical']).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onEntrance: PropTypes.func,
};

export default Tube;