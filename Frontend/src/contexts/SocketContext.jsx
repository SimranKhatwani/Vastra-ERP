import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || '');

  // Keep authToken synced in real-time
  useEffect(() => {
    const syncToken = () => {
      const currentToken = localStorage.getItem('token') || '';
      setAuthToken((prev) => (prev !== currentToken ? currentToken : prev));
    };

    syncToken();
    const interval = setInterval(syncToken, 1000); // 1s sync loop to guarantee fresh token
    window.addEventListener('focus', syncToken);
    window.addEventListener('storage', syncToken);
    window.addEventListener('auth-changed', syncToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncToken);
      window.removeEventListener('storage', syncToken);
      window.removeEventListener('auth-changed', syncToken);
    };
  }, []);

  // Maintain socket connection
  useEffect(() => {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = rawUrl.replace(/\/api\/?$/, '');

    // Disconnect old socket if creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(socketUrl, {
      auth: { token: authToken || localStorage.getItem('token') || '' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [authToken]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
