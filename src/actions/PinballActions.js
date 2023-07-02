import AppDispatcher from '../AppDispatcher';

export const moveBall = (direction) => {
  AppDispatcher.dispatch({
    type: 'MOVE_BALL',
    payload: direction,
  });
};

export const resetBall = () => {
  AppDispatcher.dispatch({
    type: 'RESET_BALL',
  });
};
