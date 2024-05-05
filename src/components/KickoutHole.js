import React, { useState } from 'react';
import styled from 'styled-components';

const KickoutHoleContainer = styled.div`
  position: absolute;
`;

const KickoutHoleStyled = styled.div`
  width: ${(props) => props.diameter || '40px'};
  height: ${(props) => props.diameter || '40px'};
  background-color: #000;
  border-radius: 50%;
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
`;

const KickoutHole = ({ id, diameter, top, left, onKick }) => {
  const [active, setActive] = useState(true);

  const handleKick = () => {
    setActive(false);
    onKick && onKick(id);
    // You can add more logic here if needed
  };

  return active ? (
    <KickoutHoleContainer style={{ top: top, left: left }}> {/* Adjust position */}
      <KickoutHoleStyled
        diameter={diameter}
        onClick={handleKick}
      />
    </KickoutHoleContainer>
  ) : null;
};

export default KickoutHole;
