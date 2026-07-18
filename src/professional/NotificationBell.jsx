import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { API_URL } from '../utils/api';
import './NotificationBell.css';

function NotificationBell({ onClick }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const professionalUser = localStorage.getItem('professionalUser');
      if (!professionalUser) return;

      const userData = JSON.parse(professionalUser);
      const token = userData.token;

      const response = await axios.get(`${API_URL}/notifications/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  return (
    <button className="notification-bell" onClick={onClick} title="Notifications" type="button">
      <Bell size={17} />
      {unreadCount > 0 && (
        <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}

export default NotificationBell;
