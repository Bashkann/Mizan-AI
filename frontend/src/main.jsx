import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Standard React 18 entry point
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
