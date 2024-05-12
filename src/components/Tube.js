import React from 'react';
import styled from 'styled-components';

// Styled components for the Tube
const TubeContainer = styled.div`
  position: absolute;
`;

const TubeStyled = styled.div`
  width: ${(props) => (props.type === 'top' ? '120px' : props.type === 'bottom' ? '60px' : '80px')};
  height: ${(props) => (props.type === 'top' || props.type === 'bottom' ? '20px' : '120px')};
  background-color: #808080; /* Gray color for the tube */
  border: 2px solid #000; /* Black border for better visibility */
  border-radius: ${(props) =>
    props.type === 'top' || props.type === 'bottom' ? '0 0 8px 8px' : '8px'}; /* Rounded corners for top and bottom tubes */
  position: absolute;
  top: ${(props) => (props.type === 'top' ? '0' : props.type === 'middle' ? '50px' : '580px')};
  left: ${(props) => (props.type === 'top' ? '340px' : props.type === 'middle' ? '280px' : '360px')};
`;

const Tube = ({ type }) => {
  return (
    <TubeContainer>
      <TubeStyled type={type} />
    </TubeContainer>
  );
};

export default Tube;
