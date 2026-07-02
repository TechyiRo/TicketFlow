import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { setupPWA } from './pwa/registerSW';

// Initialize Service Worker check loops and event alerts
setupPWA();

console.log('API Base URL compiled by Vite:', import.meta.env.VITE_API_BASE_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
