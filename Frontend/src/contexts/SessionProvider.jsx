import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SessionWarningModal from '../components/SessionWarningModal';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

// Configurable timeouts (in milliseconds)
const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes before timeout
const WARNING_TIME = SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT; // 55 minutes

export const SessionProvider = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const channelRef = useRef(null);

  const clearSessionState = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Additional frontend state reset logic can be placed here
  }, []);

  const logoutUser = useCallback(async (reason = 'Manual Logout') => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
        credentials: 'include', // Ensure cookies are sent
      });
    } catch (e) {
      console.error('Logout API failed:', e);
    }
    
    clearSessionState();
    
    // Notify other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'LOGOUT', reason });
    }

    // Force redirect to login to clear all in-memory state and history
    window.location.replace('/login');
  }, [clearSessionState]);

  const resetTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    setShowWarning(false);

    // Set Warning Timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_TIME);

    // Set Final Logout Timer
    timerRef.current = setTimeout(() => {
      logoutUser('Session Timeout');
    }, SESSION_TIMEOUT);
  }, [logoutUser]);

  const handleActivity = useCallback(() => {
    // Only reset if user is logged in (assume if there's no token in localStorage but wait, we are moving to cookies)
    // For now, if we are on a login page, we might not want this, but the provider wraps App, which is fine.
    // If warning is showing, do not auto-reset (force them to click 'Stay Logged In')
    if (!showWarning) {
      resetTimers();
    }
  }, [showWarning, resetTimers]);

  useEffect(() => {
    // Setup BroadcastChannel for Multi-Tab Sync
    channelRef.current = new BroadcastChannel('vastra_erp_session');
    
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        clearSessionState();
        window.location.replace('/login');
      } else if (event.data.type === 'ACTIVITY') {
        if (!showWarning) {
          resetTimers();
        }
      }
    };

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [clearSessionState, resetTimers, showWarning]);

  useEffect(() => {
    // Setup activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const activityHandler = () => {
      handleActivity();
      // Optionally notify other tabs of activity (debounce this in a real app to avoid spam)
    };

    events.forEach(event => document.addEventListener(event, activityHandler, { passive: true }));
    
    // Start timers initially
    resetTimers();

    return () => {
      events.forEach(event => document.removeEventListener(event, activityHandler));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [handleActivity, resetTimers]);

  const handleStayLoggedIn = () => {
    resetTimers();
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'ACTIVITY' });
    }
  };

  return (
    <SessionContext.Provider value={{ logoutUser, clearSessionState }}>
      {children}
      {showWarning && (
        <SessionWarningModal
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={() => logoutUser('Manual Logout')}
        />
      )}
    </SessionContext.Provider>
  );
};
