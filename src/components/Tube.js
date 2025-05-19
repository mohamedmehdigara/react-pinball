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
  justify-content: ${props => props.type === 'top' ? 'flex-start' : (props.type === 'bottom' ? 'flex-end' : 'center')};
  overflow: hidden; /* To contain inner tube and shadows */
`;

const InnerTube = styled.div`
  width: 80%;
  height: 100%;
  background-color: #444; /* Darker inner color */
  border-radius: 8px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3) inset,
              -1px -1px 3px rgba(255, 255, 255, 0.1) inset; /* Inner shadow for depth */
  position: relative;

  /* Add a subtle shine effect */
  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 30%;
    height: 10%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    filter: blur(1px);
  }
`;

const EntranceGlow = styled.div`
  position: absolute;
  top: ${props => props.type === 'top' ? '-10px' : 'auto'};
  bottom: ${props => props.type === 'bottom' ? '-10px' : 'auto'};
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 20px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  opacity: 0.7;
`;

const Tube = ({ type, x, y, width, height, onEntrance }) => {
  const handleMouseEnter = () => {
    if (onEntrance) {
      onEntrance(x, y, width, height);
    }
  };

  return (
    <TubeContainer x={x} y={y} width={width} height={height} type={type} onMouseEnter={handleMouseEnter}>
      <EntranceGlow type={type} />
      <InnerTube />
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