import { combineReducers } from 'redux';

// Action types
export const MOVE_BALL = 'MOVE_BALL';
export const RESET_BALL = 'RESET_BALL';

const initialState = {
  ball: {
    position: 0,
  },
};

// Action creators
export const moveBall = (direction) => {
  return {
    type: MOVE_BALL,
    payload: direction,
  };
};

export const resetBall = () => {
  return {
    type: RESET_BALL,
  };
};


const ballReducer = (state = initialState.ball, action) => {
  switch (action.type) {
    case 'MOVE_BALL':
      return {
        ...state,
        position: state.position + action.payload * 5,
      };
    case 'RESET_BALL':
      return {
        ...state,
        position: 0,
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  ball: ballReducer,
});

export default rootReducer;

  