import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import App from './App.jsx';
import './i18n';
import { SpotifyProvider } from './context/SpotifyContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <SpotifyProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SpotifyProvider>
    </Provider>
  </React.StrictMode>
);
