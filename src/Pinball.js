import React, { Component } from 'react';
import Ball from './Ball';
import Flipper from './Flipper';
import PinballStore from './PinballStore';
import { moveBall, resetBall } from './actions/PinballActions';

class Pinball extends Component {
  constructor(props) {
    super(props);
    this.state = PinballStore.getState();
  }

  componentDidMount() {
    PinballStore.addChangeListener(this.handleStoreChange);
  }

  componentWillUnmount() {
    PinballStore.removeChangeListener(this.handleStoreChange);
  }

  handleStoreChange = () => {
    this.setState(PinballStore.getState());
  };

  handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      moveBall(-1);
    } else if (event.key === 'ArrowRight') {
      moveBall(1);
    } else if (event.key === 'ArrowUp') {
      resetBall();
    }
  };

  render() {
    const { ballPosition } = this.state;

    return (
      <div className="pinball-container" onKeyDown={this.handleKeyDown} tabIndex={0}>
        <Ball position={ballPosition} />
        <Flipper />
        <Flipper />
      </div>
    );
  }
}

export default Pinball;
