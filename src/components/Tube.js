import React from 'react';
import styled from 'styled-components';

const Tube = styled.div`
  width: 100px;
  height: 100px;
  background-color: #777;
  position: absolute;
  border-radius: 50%;
  ${(props) => {
    switch (props.type) {
      case 'top':
        return 'top: 50px; left: 300px;';
      case 'middle':
        return 'top: 200px; left: 600px;';
      case 'bottom':
        return 'top: 400px; left: 300px;';
      default:
        return '';
    }
  }}
`;

export default Tube;
