import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from './AuthContext';
import SuperAdminHomeWeb from './HomeScreen.web.js';
import LoginScreen from './LoginScreen';
import SaturdayRequirementsPopover from './SaturdayRequirementsPopover';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#3863A8', fontWeight: 'bold' }}>
        ESTABLISHING SECURE CONNECTION...
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? <SuperAdminHomeWeb /> : <LoginScreen />}
      {user && <SaturdayRequirementsPopover />}
    </BrowserRouter>
  );
}
