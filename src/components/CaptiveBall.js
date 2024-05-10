import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';

const CaptiveBallContainer = styled.div`
  position: absolute;
`;

const CaptiveBallStyled = styled.div`
  width: ${(props) => props.size || '30px'}; /* Adjust size for better visibility */
  height: ${(props) => props.size || '30px'}; /* Adjust size for better visibility */
  background-color: ${(props) => (props.released ? '#D3D3D3' : '#FFD700')};
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: ${(props) => (props.released ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.released ? 0.5 : 1)};
  transition: background-color 0.3s ease, opacity 0.3s ease;
  z-index: 1; /* Ensure the captive ball is above other elements */
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
