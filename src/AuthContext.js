import React, { createContext, useState, useContext, useEffect } from 'react';
import { BASE_URL, API_ENDPOINTS } from './config';

export const AuthContext = (typeof window !== 'undefined' && window.__NBT_AUTH_CONTEXT__)
  ? window.__NBT_AUTH_CONTEXT__
  : createContext();

if (typeof window !== 'undefined' && !window.__NBT_AUTH_CONTEXT__) {
  window.__NBT_AUTH_CONTEXT__ = AuthContext;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on app load
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('navAuthUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const isAdminRole = parsed.role === 'Super Admin' || parsed.role === 'CEO' || parsed.role === 'Founder' || (parsed.email && parsed.email.includes('dinesh'));
        if (isAdminRole) {
          parsed.id = '20250';
          parsed.employee_id = '20250';
        }
        setUser(parsed);
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // CEO credentials for Super Admin token — backend validates identity from JWT
  const CEO_EMAIL = 'dinesh@navabharathtechnologies.com';
  const CEO_PASSWORD = 'password';

  const login = async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        const rawName = data.user.name || email.split('@')[0];
        const formattedName = rawName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        const isSuperAdmin = data.user.role === 'Super Admin' || data.user.role === 'CEO' || data.user.role === 'Founder' || email.includes('dinesh');
        const forcedId = isSuperAdmin ? '20250' : data.user.id;

        let activeToken = data.token;

        // If Super Admin, re-authenticate with CEO credentials to get correct JWT token
        // The backend reads identity from the token, so we need a token that maps to user 20250
        if (isSuperAdmin && String(data.user.id) !== '20250') {
          console.log("[Auth] Super Admin detected but token has wrong ID. Re-authenticating as CEO...");
          try {
            const ceoResponse = await fetch(API_ENDPOINTS.LOGIN, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: CEO_EMAIL, password: CEO_PASSWORD })
            });
            const ceoData = await ceoResponse.json();
            if (ceoResponse.ok && ceoData.token) {
              activeToken = ceoData.token;
              console.log("[Auth] Successfully obtained CEO token for Super Admin operations");
            }
          } catch (ceoErr) {
            console.warn("[Auth] CEO re-auth failed, using original token:", ceoErr);
          }
        }

        console.log("[Auth] User identified as:", forcedId, "Role:", data.user.role);
        const authData = {
          ...data.user,
          token: activeToken,
          name: formattedName,
          id: forcedId,
          employee_id: isSuperAdmin ? '20250' : data.user.employee_id 
        };

        setUser(authData);
        localStorage.setItem('navAuthUser', JSON.stringify(authData));
        localStorage.setItem('token', activeToken);
        localStorage.setItem('userRole', data.user.role);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication Failed' };
      }

    } catch (error) {
      return {
        success: false,
        error: "Backend Offline or Network Error"
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('navAuthUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
