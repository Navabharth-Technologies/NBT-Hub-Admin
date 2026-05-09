import React from 'react';
import { useAuth } from './AuthContext.js';
import SuperAdminHomeWeb from './HomeScreen.web.js';
import LoginScreen from './LoginScreen.js';
import SaturdayRequirementsPopover from './SaturdayRequirementsPopover.js';

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
    <>
      {user ? <SuperAdminHomeWeb /> : <LoginScreen />}
      {user && <SaturdayRequirementsPopover />}
    </>
  );
}
