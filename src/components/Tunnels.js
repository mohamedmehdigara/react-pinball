import React from 'react';
import styled from 'styled-components';

const Tunnel = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #000;
  border-radius: 5px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5); // Optional shadow effect
`;

const Tunnels = ({ tunnels }) => {
  return (
    <>
      {tunnels.map((tunnel) => (
        <Tunnel key={tunnel.id} {...tunnel} />
      ))}
    </>
  );
};

export default Tunnels;
