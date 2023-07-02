import { EventEmitter } from 'events';
import AppDispatcher from './AppDispatcher';

let ballPosition = 0;

const PinballStore = Object.assign({}, EventEmitter.prototype, {
  getState: () => {
    return {
      ballPosition: ballPosition,
    };
  },

  emitChange: () => {
    PinballStore.emit('change');
  },

  addChangeListener: (callback) => {
    PinballStore.on('change', callback);
  },

  removeChangeListener: (callback) => {
    PinballStore.removeListener('change', callback);
  },
});

AppDispatcher.register((action) => {
  switch (action.type) {
    case 'MOVE_BALL':
      ballPosition += action.payload * 5;
      PinballStore.emitChange();
      break;
    case 'RESET_BALL':
      ballPosition = 0;
      PinballStore.emitChange();
      break;
    default:
      break;
  }
});

export default PinballStore;
