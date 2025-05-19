import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const LauncherContainer = styled.div`
  position: absolute;
  bottom: ${props => props.bottom}px;
  right: ${props => props.right}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #555;
  border-radius: 10px;
  border: 2px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
`;

const PlungerTrack = styled.div`
  width: 30px;
  height: ${props => props.trackHeight}px;
  background-color: #777;
  border-radius: 5px;
  margin-bottom: 10px;
  position: relative;
`;

const PlungerHandle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${props => props.handleHeight}px;
  background-color: #aaa;
  border-radius: 5px;
  border: 1px solid #666;
  cursor: grab;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.8em;
  color: #333;
`;

const BallDisplay = styled.div`
  width: ${props => props.ballSize}px;
  height: ${props => props.ballSize}px;
  border-radius: 50%;
  background-color: #eee;
  border: 1px solid #ccc;
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
`;

const BallLauncher = ({ onLaunch, bottom = 20, right = 20, width = 60, height = 150, trackHeight = 120, handleHeight = 40, ballSize = 24, maxPull = 80 }) => {
  const [pullPosition, setPullPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const plungerTrackRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !plungerTrackRef.current) return;
    const trackRect = plungerTrackRef.current.getBoundingClientRect();
    const mouseY = e.clientY;
    const topOfTrack = trackRect.top;
    const bottomOfTrack = trackRect.bottom - handleHeight;

    let newPull = Math.max(0, Math.min(bottomOfTrack - mouseY, maxPull));
    setPullPosition(newPull);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const launchPower = pullPosition / maxPull;

    setPullPosition(0);
    if (launchPower > 0 && onLaunch) {
      onLaunch(launchPower);
    }
  };

  return (
    <LauncherContainer bottom={bottom} right={right} width={width} height={height}>
      <PlungerTrack ref={plungerTrackRef} trackHeight={trackHeight}>
        <BallDisplay ballSize={ballSize} />
        <PlungerHandle
          style={{ bottom: pullPosition + 'px' }}
          onMouseDown={handleMouseDown}
          handleHeight={handleHeight}
        >
          Pull
        </PlungerHandle>
      </PlungerTrack>
      <div>Pull and Release</div>
    </LauncherContainer>
  );
};

BallLauncher.propTypes = {
  onLaunch: PropTypes.func.isRequired,
  bottom: PropTypes.number,
  right: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  trackHeight: PropTypes.number,
  handleHeight: PropTypes.number,
  ballSize: PropTypes.number,
  maxPull: PropTypes.number,
};

export default BallLauncher;