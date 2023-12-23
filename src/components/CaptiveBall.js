import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';

// Define a bounce animation
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const CaptiveBallContainer = styled.div`
  position: absolute;
`;

const CaptiveBallStyled = styled.div`
  width: ${(props) => props.size || '20px'};
  height: ${(props) => props.size || '20px'};
  background-color: ${(props) => (props.released ? '#D3D3D3' : '#FFD700')};
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: ${(props) => (props.released ? 'not-allowed' : 'pointer')};
  animation: ${(props) => (props.released ? 'none' : css`${bounce} 1s ease infinite`)};
  opacity: ${(props) => (props.released ? 0.5 : 1)};
  transition: background-color 0.3s ease, opacity 0.3s ease;
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
    <CaptiveBallContainer>
      {!released && (
        <CaptiveBallStyled
          size={size}
          top={top}
          left={left}
          released={released}
          onClick={handleClick}
        />
      )}
    </CaptiveBallContainer>
  );
};

export default CaptiveBall;
