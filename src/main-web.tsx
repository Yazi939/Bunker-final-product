import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWeb from './AppWeb';
import './index.css';

// Configure API base URL for web (тот же хост, порт бэкенда — работает и по IP в LAN)
if (typeof window !== 'undefined') {
  window.API_BASE_URL =
    window.location.protocol === 'https:'
      ? 'https://bunker-boats.ru/api'
      : `http://${window.location.hostname}:5000/api`;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWeb />
  </React.StrictMode>,
); 