import api from '../api/axios';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SessionWarningModal from '../components/SessionWarningModal';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

// Configurable timeouts (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000;       // 30 minutes → auto-logout
const WARNING_BEFORE_TIMEOUT = 1 * 60 * 1000;  // 1 minute before logout → show warning
const WARNING_TIME = SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT; // 29 minutes of inactivity → show warning

export const SessionProvider = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);

  // Use refs so all callbacks always have fresh values without needing re-creation
  const timerRef       = useRef(null);
  const warningRef     = useRef(null);
  const channelRef     = useRef(null);
  const showWarningRef = useRef(false); // mirrors showWarning state but accessible in closures

  // Keep the ref in sync with state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // ── Clear session storage ──────────────────────────────────────────────────
  const clearSessionState = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logoutUser = useCallback(async (reason = 'Manual Logout') => {
    // Clear any pending timers first
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);

    try {
      await api.post(`/auth/logout`, { reason });
    } catch (e) {
      console.error('Logout API failed:', e);
    }

    clearSessionState();

    // Notify other tabs
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'LOGOUT', reason });
      }
    } catch (_) {}

    window.location.replace('/login');
  }, [clearSessionState]);

  // ── Reset timers (uses refs to avoid stale closures) ──────────────────────
  const resetTimers = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);

    setShowWarning(false);
    showWarningRef.current = false;

    // Warning fires at WARNING_TIME (1 min of inactivity)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      showWarningRef.current = true;
    }, WARNING_TIME);

    // Auto-logout fires at SESSION_TIMEOUT (2 min of inactivity)
    timerRef.current = setTimeout(() => {
      logoutUser('Session Timeout');
    }, SESSION_TIMEOUT);
  }, [logoutUser]);

  // ── Activity handler — uses ref to check warning state (no stale closure) ─
  const handleActivity = useCallback(() => {
    // Don't reset if warning is already showing — force user to click "Stay Logged In"
    if (!showWarningRef.current) {
      resetTimers();
    }
  }, [resetTimers]);

  // ── Set up activity listeners ONCE on mount ────────────────────────────────
  useEffect(() => {
    // Exclude mousemove — fires constantly and prevents the timer from ever expiring
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(evt => document.addEventListener(evt, handleActivity, { passive: true }));

    // Start timers on mount
    resetTimers();

    return () => {
      events.forEach(evt => document.removeEventListener(evt, handleActivity));
      clearTimeout(timerRef.current);
      clearTimeout(warningRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← empty deps: only run once on mount

  // ── Multi-tab sync via BroadcastChannel ───────────────────────────────────
  useEffect(() => {
    channelRef.current = new BroadcastChannel('vastra_erp_session');

    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        clearSessionState();
        window.location.replace('/login');
      } else if (event.data.type === 'ACTIVITY') {
        if (!showWarningRef.current) {
          resetTimers();
        }
      }
    };

    return () => {
      channelRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← empty deps: only run once on mount

  // ── Stay logged in ─────────────────────────────────────────────────────────
  const handleStayLoggedIn = () => {
    resetTimers();
    try {
      channelRef.current?.postMessage({ type: 'ACTIVITY' });
    } catch (_) {}
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
