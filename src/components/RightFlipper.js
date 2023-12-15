import React from 'react';
import styled from 'styled-components';

const FlipperBase = styled.div`
  width: 160px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
`;

const RightFlipper = styled(FlipperBase)`
  transform-origin: right center;
  transform: rotate(${(props) => (props.up ? '30deg' : '0deg')});
  right: 50px;
`;

export default RightFlipper;
