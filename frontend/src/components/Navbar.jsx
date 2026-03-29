import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/employees', label: 'Employees', icon: '👥' },
  { path: '/attendance', label: 'Attendance', icon: '📅' },
  { path: '/payroll', label: 'Payroll', icon: '💰' },
  { path: '/transactions', label: 'Transactions', icon: '💳' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        width: '240px',
        minHeight: '100vh',
        background: '#12122a',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
            ⚡ HR Payroll
          </span>
        </div>
        {user && (
          <div style={{ marginTop: '12px', padding: '0 4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user.companyName}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
              {user.name}
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 600,
                background: 'rgba(99,102,241,0.15)',
                color: '#818cf8',
                marginTop: '4px',
                textTransform: 'capitalize',
              }}
            >
              {user.role}
            </span>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? 'white' : '#94a3b8',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(14,165,233,0.2))'
                  : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: '12px' }}>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
