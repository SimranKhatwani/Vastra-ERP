import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    const syncToken = () => setAuthToken(localStorage.getItem('token'));
    syncToken();
    window.addEventListener('focus', syncToken);
    window.addEventListener('storage', syncToken);
    return () => {
      window.removeEventListener('focus', syncToken);
      window.removeEventListener('storage', syncToken);
    };
  }, []);

  useEffect(() => {
    if (!authToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      auth: { token: authToken },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 8000,
      transports: ['websocket', 'polling'], // websocket first = faster, polling as fallback
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', () => setConnected(false));

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
