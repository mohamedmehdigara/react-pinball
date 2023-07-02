import React from 'react';
import { connect } from 'react-redux';
import "./Pinball.css"

const Pinball = ({ ballPosition, moveBall, resetBall }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      moveBall(-1);
    } else if (event.key === 'ArrowRight') {
      moveBall(1);
    } else if (event.key === 'ArrowUp') {
      resetBall();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="pinball-container">
      <div className="pinball-ball" style={{ left: ballPosition }}></div>
      <div className="pinball-flipper"></div>
      <div className="pinball-flipper"></div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    ballPosition: state.ball.position,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    moveBall: (direction) => dispatch({ type: 'MOVE_BALL', payload: direction }),
    resetBall: () => dispatch({ type: 'RESET_BALL' }),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Pinball);
