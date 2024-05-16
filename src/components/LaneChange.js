import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #ccc;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const LaneChange = ({ onClick }) => {
  const handleLeftLaneChange = () => {
    onClick('left');
  };

  const handleRightLaneChange = () => {
    onClick('right');
  };

  return (
    <>
      <Button onClick={handleLeftLaneChange}>Move Left</Button>
      <Button onClick={handleRightLaneChange}>Move Right</Button>
    </>
  );
};

export default LaneChange;
