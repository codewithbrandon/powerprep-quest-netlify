import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProfileProvider } from './context/ProfileContext.jsx';
import { TrackProvider } from './context/TrackContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TrackProvider>
          <ProfileProvider>
            <App />
          </ProfileProvider>
        </TrackProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
