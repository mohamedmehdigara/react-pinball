import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import reducer from './actions/reducers';
import App from './App';

const store = createStore(reducer);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);
