import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL, getAuthHeaders } from '../utils/api'
import './NotificationsCenter.css'

function NotificationsCenter() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, unread, urgent
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
    
    // Setup click outside listener
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      clearInterval(interval)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data || [])
        setUnreadCount(data.data?.filter(n => !n.read).length || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      })
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const deleteNotification = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getIcon = (type) => {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      urgent: '🚨',
      message: '💬',
      reminder: '🔔',
      system: '⚙️',
      approval: '📋',
      schedule: '📅'
    }
    return icons[type] || '🔔'
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    
    if (seconds < 60) return 'À l\'instant'
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'urgent') return n.type === 'urgent' || n.priority === 'high'
    return true
  })

  return (
    <div className="notifications-center" ref={dropdownRef}>
      {/* Bell Icon */}
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notifications-dropdown">
          {/* Header */}
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="notification-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tout ({notifications.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Non lu ({unreadCount})
            </button>
            <button 
              className={`filter-btn ${filter === 'urgent' ? 'active' : ''}`}
              onClick={() => setFilter('urgent')}
            >
              🚨 Urgent
            </button>
          </div>

          {/* List */}
          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>Aucune notification</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.type}`}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                >
                  <div className="notification-icon">
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <span className="unread-dot" title="Non lu" />
                    )}
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification._id)
                      }}
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notifications-footer">
            <a href="/notifications" className="view-all-link">
              Voir toutes les notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsCenter
