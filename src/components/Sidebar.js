import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { colors, typography } from '../styles/GlobalStyles';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Check if current path matches
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path || location.pathname === '/';
    }
    // Use exact match for more precise highlighting
    return location.pathname === path;
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
    // Menu items configuration
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/reports', label: 'Reports', icon: '📄' },
    { path: '/pending-reviews', label: 'Pending Reviews', icon: '📋' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/support-tickets', label: 'Support Tickets', icon: '🎫' }
  ];
  
  const managementItems = [
    { path: '/support', label: 'Support', icon: '🛠️' },
    { action: handleLogout, label: 'Log Out', icon: '🚪' }
  ];
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <>
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-menu-open' : ''}`} style={{ 
        background: '#fff', 
        boxShadow: '0 0 20px rgba(0,0,0,0.05)',
        height: '100vh',
        position: 'fixed',
        width: '250px',
        transition: 'all 0.3s ease'
      }}>
        <div className="sidebar-header" style={{ padding: '24px 0', textAlign: 'center' }}>
          <div className="avatar" style={{ 
            height: 48, 
            width: 48, 
            background: colors.primary, 
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontSize: 20,
            margin: '0 auto'
          }}>👤</div>
          <div className="admin-label" style={{ marginTop: 8, fontWeight: typography.fontWeights.semibold }}>Admin</div>
        </div>
        
        <nav className="sidebar-menu" style={{ padding: '0 16px' }}>
          <div className="menu-section">
            <div className="menu-title" style={{ 
              color: '#6c757d', 
              fontSize: typography.fontSizes.xs, 
              fontWeight: typography.fontWeights.semibold,
              marginBottom: 12,
              paddingLeft: 8
            }}>
              Main Menu
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {menuItems.map((item) => (
                <li 
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '12px 16px',
                    borderRadius: 8,
                    margin: '4px 0',
                    transition: 'all 0.2s',
                    background: isActive(item.path) ? colors.primary : 'transparent',
                    color: isActive(item.path) ? '#fff' : colors.darkText,
                    fontWeight: isActive(item.path) ? typography.fontWeights.semibold : typography.fontWeights.normal,
                    boxShadow: isActive(item.path) ? '0 4px 12px rgba(67, 97, 238, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span role="img" aria-label={item.label} style={{ marginRight: 12, fontSize: 18 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="menu-section" style={{ marginTop: 24 }}>
            <div className="menu-title" style={{ 
              color: '#6c757d', 
              fontSize: typography.fontSizes.xs, 
              fontWeight: typography.fontWeights.semibold,
              marginBottom: 12,
              paddingLeft: 8
            }}>
              Management
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {managementItems.map((item, index) => (
                <li 
                  key={index}
                  onClick={item.action || (() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  })}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '12px 16px',
                    borderRadius: 8,
                    margin: '4px 0',
                    transition: 'all 0.2s',
                    background: isActive(item.path) ? colors.primary : 'transparent',
                    color: item.action ? colors.warning : (isActive(item.path) ? '#fff' : colors.darkText),
                    fontWeight: isActive(item.path) ? typography.fontWeights.semibold : typography.fontWeights.normal,
                    boxShadow: isActive(item.path) ? '0 4px 12px rgba(67, 97, 238, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span role="img" aria-label={item.label} style={{ marginRight: 12, fontSize: 18 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>
      
      {/* Mobile Bottom Navigation */}
      <div className="mobile-menu" style={{ 
        display: 'none', 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        height: '60px',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        {menuItems.slice(0, 4).map((item) => (
          <div 
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive(item.path) ? colors.primary : '#6c757d',
              fontWeight: isActive(item.path) ? typography.fontWeights.semibold : typography.fontWeights.normal,
              fontSize: typography.fontSizes.xs,
              cursor: 'pointer',
              padding: '8px',
              flex: 1,
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ marginTop: '4px' }}>{item.label.split(' ')[0]}</span>
          </div>
        ))}
        
        <div 
          onClick={toggleMobileMenu}
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: mobileMenuOpen ? colors.primary : '#6c757d',
            fontWeight: typography.fontWeights.normal,
            fontSize: typography.fontSizes.xs,
            cursor: 'pointer',
            padding: '8px',
            flex: 1,
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '20px' }}>☰</span>
          <span style={{ marginTop: '4px' }}>Menu</span>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}
    </>
  );
};

export default Sidebar;
