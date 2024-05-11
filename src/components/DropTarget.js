import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: absolute;
  /* Adjust position as needed */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const TargetArea = styled.div`
  width: 100px;
  height: 100px;
  border: 2px dashed #fff; /* Dashed border for visibility */
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  color: #fff;
`;

const DropTarget = ({ label }) => {
  return (
    <Container>
      <TargetArea>
        {label}
      </TargetArea>
    </Container>
  );
};

export default DropTarget;
