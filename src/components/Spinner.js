import React, { useEffect } from 'react';
import styled from 'styled-components';

const SpinnerBase = styled.div`
  width: 30px;
  height: 30px;
  background-color: #555;
  position: absolute;
  ${(props) => (props.type === 'left' ? 'left: 100px;' : 'right: 100px;')}
`;

const Spinner = ({ type }) => {
  useEffect(() => {
    // You can add spinner rotation logic here
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  return <SpinnerBase type={type} />;
};

export default Spinner;
