import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const LauncherContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 60px;
  height: 150px;
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
  height: 120px;
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
  height: 40px;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #eee;
  border: 1px solid #ccc;
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
`;

const BallLauncher = ({ onLaunch }) => {
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
    const bottomOfTrack = trackRect.bottom - 40; // Account for handle height

    // Calculate new pull position relative to the track
    let newPull = Math.max(0, Math.min(bottomOfTrack - mouseY, 80)); // Limit pull
    setPullPosition(newPull);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Calculate launch power based on pull position (0 to 80)
    const launchPower = pullPosition / 80; // Normalize to 0-1

    // "Release" the plunger and trigger launch
    setPullPosition(0);
    if (launchPower > 0 && onLaunch) {
      onLaunch(launchPower);
    }
  };

  return (
    <LauncherContainer>
      <PlungerTrack ref={plungerTrackRef}>
        <BallDisplay />
        <PlungerHandle
          style={{ bottom: pullPosition + 'px' }}
          onMouseDown={handleMouseDown}
        >
          Pull
        </PlungerHandle>
      </PlungerTrack>
      <div>Pull and Release</div>
    </LauncherContainer>
  );
};

export default BallLauncher;