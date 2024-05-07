import React from 'react';
import styled from 'styled-components';
import LeftFlipper from './components/LeftFlipper';
import RightFlipper from './components/RightFlipper';
import Ball from './components/Ball';
import Tube from './components/Tube';
import Blocks from './components/Blocks';
import Spinner from './components/Spinner';
import GameOverMessage from './components/GameOverMessage';
import ScoreDisplay from './components/ScoreDisplay';
import BallLauncher from './components/BallLauncher';
import Bumper from './components/Bumper';
import LaneGuide from './components/LaneGuide';
import Kickback from './components/Kickback';
import Rollover from './components/Rollover';
import DropTarget from './components/DropTarget';
import KickoutHole from './components/KickoutHole';
import Magnet from './components/Magnet';
import CaptiveBall from './components/CaptiveBall';
import Hole from './components/Hole';
import Multiball from './components/Multiball';
import SkillShot from './components/SkillShot';
import DynamicObstacle from './components/DynamicObstacle';
import MysteryTarget from './components/MysteryTarget';
import ComboMeter from './components/ComboMeter';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #222;
`;

const PinballGame = styled.div`
  position: relative;
  width: 800px;
  height: 600px;
  background-color: #444;
  border: 2px solid #222;
`;

const BottomRightWrapper = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
`;

const TopLeftWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`;

const Pinball = () => {
  return (
    <Container>
      <PinballGame>
        {/* Top Left Components */}
        <TopLeftWrapper>
          {/* Score Display */}
          <ScoreDisplay />
          {/* Game Over Message */}
          <GameOverMessage>Game Over</GameOverMessage>
        </TopLeftWrapper>

        {/* Flippers */}
        <LeftFlipper />
        <RightFlipper />

        {/* Ball */}
        <Ball />

        {/* Tubes */}
        <Tube type="top" />
        <Tube type="middle" />
        <Tube type="bottom" />

        {/* Blocks */}
        <Blocks />

        {/* Spinners */}
        <Spinner type="left" />
        <Spinner type="right" />

        {/* Other Components */}
        <BallLauncher />
        <Bumper />
        <LaneGuide />
        <Kickback />
        <Rollover />
        <DropTarget />
        <KickoutHole />
        <Magnet />
        <CaptiveBall />
        <Hole />
        <Multiball />
        <SkillShot />
        <DynamicObstacle />
        <MysteryTarget />

        {/* Bottom Right Components */}
        <BottomRightWrapper>
          <ComboMeter />
        </BottomRightWrapper>
      </PinballGame>
    </Container>
  );
};

export default Pinball;
