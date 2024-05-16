import React from 'react';
import styled from 'styled-components';

const TubeContainer = styled.div`
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 300px;
  background-color: #444;
  border: 2px solid #222;
`;

const Tube = () => {
  return <TubeContainer />;
};

export default Tube;
