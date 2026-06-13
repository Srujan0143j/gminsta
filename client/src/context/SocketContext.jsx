import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use refs to store callback listeners dynamically for message windows
  const messageListenersRef = useRef([]);

  const addMessageListener = (callback) => {
    messageListenersRef.current.push(callback);
  };

  const removeMessageListener = (callback) => {
    messageListenersRef.current = messageListenersRef.current.filter((cb) => cb !== callback);
  };

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const res = await api.get('/notifications');
          if (res.data.success) {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.notifications.filter((n) => !n.isRead).length);
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
  }, [user]);

  // Handle Socket.io connection lifecycle
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      setSocket(newSocket);

      // Listener for online users roster
      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      // Listener for real-time notifications
      newSocket.on('newNotification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Custom audio overlay or browser notifications could go here
        try {
          const audio = new Audio('/uploads/notification.mp3');
          audio.volume = 0.45;
          audio.play().catch(() => {}); // catch autoplay blocks
        } catch (e) {}
      });

      // Listener for real-time messages
      newSocket.on('newMessage', (data) => {
        // Dispatch to all registered listeners (e.g. Chat pages)
        messageListenersRef.current.forEach((listener) => {
          listener(data);
        });
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setOnlineUsers([]);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  // Clear notifications
  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        unreadCount,
        markAllAsRead,
        clearAllNotifications,
        addMessageListener,
        removeMessageListener,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
