import React from 'react';
import styled from 'styled-components';

const FlipperBase = styled.div`
  width: 160px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
`;

const LeftFlipper = styled(FlipperBase)`
  transform-origin: left center;
  transform: rotate(${(props) => (props.up ? '-30deg' : '0deg')});
  left: 50px;
`;

export default LeftFlipper;
