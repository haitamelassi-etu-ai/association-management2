import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { MessageCircle, X } from 'lucide-react';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import { SOCKET_URL } from '../services/api';
import { API_URL } from '../utils/api';
import './ChatFloatingButton.css';

const ChatFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('professionalUser');
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token: currentUser.token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket connection warning:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?.token]);

  const fetchUnreadCount = async () => {
    if (!currentUser?.token) return;

    try {
      const response = await axios.get(`${API_URL}/chat/unread/count`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = window.setInterval(fetchUnreadCount, 30000);
    return () => window.clearInterval(interval);
  }, [currentUser?.token]);

  useEffect(() => {
    if (!socket) return undefined;

    socket.on('message:received', fetchUnreadCount);

    return () => {
      socket.off('message:received', fetchUnreadCount);
    };
  }, [socket]);

  const toggleChat = () => {
    setIsOpen((opened) => !opened);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUnreadCount();
  };

  const handleCloseChat = () => {
    setSelectedUser(null);
  };

  if (!currentUser) return null;

  return (
    <>
      <button
        className="chat-floating-btn"
        onClick={toggleChat}
        type="button"
        aria-label={isOpen ? 'Fermer la messagerie' : 'Ouvrir la messagerie'}
        title={isOpen ? 'Fermer la messagerie' : 'Messagerie'}
      >
        <MessageCircle size={20} />
        <span className="chat-floating-label">Messages</span>
        {unreadCount > 0 && (
          <span className="chat-floating-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="chat-panel-overlay">
          <div className="chat-panel">
            <ConversationsList
              onSelectUser={handleSelectUser}
              selectedUserId={selectedUser?._id}
              socket={socket}
            />
            <ChatWindow
              selectedUser={selectedUser}
              socket={socket}
              onClose={handleCloseChat}
            />
          </div>
          <button
            className="chat-panel-close"
            onClick={toggleChat}
            type="button"
            aria-label="Fermer la messagerie"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  );
};

export default ChatFloatingButton;
