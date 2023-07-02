import React from 'react';

const Ball = ({ position }) => {
  return <div className="pinball-ball" style={{ left: position }}></div>;
};

export default Ball;
