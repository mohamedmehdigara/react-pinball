import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const HoleContainer = styled.div`
  position: absolute;
`;

const HoleStyled = styled.div`
  width: ${(props) => props.size || '30px'};
  height: ${(props) => props.size || '30px'};
  background-color: #000;
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
`;

const Hole = ({ id, size, top, left, onEnter }) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (entered) {
      // Logic when the ball enters the hole
      onEnter && onEnter(id);
    }
  }, [entered, id, onEnter]);

  const handleEnter = () => {
    // Logic when the ball enters the hole
    setEntered(true);
  };

  return (
    <HoleContainer>
      {!entered && (
        <HoleStyled size={size} top={top} left={left} onClick={handleEnter} />
      )}
    </HoleContainer>
  );
};

export default Hole;
