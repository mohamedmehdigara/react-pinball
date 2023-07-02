import { combineReducers } from 'redux';

const initialState = {
  ball: {
    position: 0,
  },
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

  