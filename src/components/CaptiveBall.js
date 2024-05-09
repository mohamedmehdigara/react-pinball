import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';

// Define a bounce animation
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-2px);
  }
`;

const CaptiveBallContainer = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
`;

const CaptiveBallStyled = styled.div`
  width: ${(props) => props.size || '30px'};
  height: ${(props) => props.size || '30px'};
  background-color: ${(props) => (props.released ? '#D3D3D3' : '#FFD700')};
  border-radius: 50%;
  position: absolute;
  cursor: ${(props) => (props.released ? 'not-allowed' : 'pointer')};
  animation: ${(props) => (props.released ? 'none' : css`${bounce} 1s ease infinite`)};
  opacity: ${(props) => (props.released ? 0.5 : 1)};
  transition: background-color 0.3s ease, opacity 0.3s ease;
  z-index: 1;
`;

const CaptiveBall = ({ id, size, top, left, isReleased, onRelease, onCaptiveClick }) => {
  const [released, setReleased] = useState(false);

  useEffect(() => {
    if (isReleased) {
      setReleased(true);
      onRelease && onRelease(id);
    }
  }, [isReleased, id, onRelease]);

  const handleClick = () => {
    onCaptiveClick && onCaptiveClick(id);
  };

  return (
    <CaptiveBallContainer style={{ top: `${top}px`, left: `${left}px` }}>
      {!released && (
        <CaptiveBallStyled
          size={size}
          released={released}
          onClick={handleClick}
        />
      )}
    </CaptiveBallContainer>
  );
};

export default CaptiveBall;
