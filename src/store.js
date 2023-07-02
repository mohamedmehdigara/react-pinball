import { createStore } from 'redux';
import rootReducer from './actions/reducers';

const store = createStore(rootReducer);

export default store;
