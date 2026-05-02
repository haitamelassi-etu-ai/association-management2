// Shared Sidebar Component
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Tableau de bord',
    items: [
      { path: '/professional/dashboard', icon: '📊', label: 'Dashboard' },
    ]
  },
  {
    label: 'Gestion',
    items: [
      { path: '/professional/food-stock', icon: '🏪', label: 'Stock Alimentaire' },
      { path: '/professional/transport',  icon: '🚌', label: 'Transport' },
    ]
  },
];

export const ProfessionalSidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-wrap">
            <span className="sidebar-logo-icon">🌟</span>
          </div>
          <h2>Al Amal</h2>
          <p>Portail de gestion</p>
          <button
            className="mobile-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">🏥</div>
            <div className="user-details">
              <div className="user-name">Al Amal</div>
              <div className="user-role">Association</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
