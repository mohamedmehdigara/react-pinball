import React from 'react';
import styled from 'styled-components';

const Tube = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #333; // Adjust color as needed
  border-radius: 5px;
`;

export default Tube;
