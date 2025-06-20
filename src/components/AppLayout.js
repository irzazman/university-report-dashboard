import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { responsiveStyles } from '../styles/GlobalStyles';

const AppLayout = ({ children }) => {
  // Add responsive styles once when component mounts
  useEffect(() => {
    // Create style element if it doesn't exist
    if (!document.getElementById('responsive-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'responsive-styles';
      styleEl.innerHTML = responsiveStyles;
      document.head.appendChild(styleEl);
    }
    
    // Set meta viewport for mobile responsiveness
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
      document.head.appendChild(meta);
    }
    
    // Add base styles to body
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    document.body.style.backgroundColor = '#f5f7fa';
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className="dashboard-container" style={{ 
      display: 'flex',
      minHeight: '100vh',
      position: 'relative'
    }}>
      <Sidebar />
      <main className="main-content" style={{ 
        flex: 1,
        marginLeft: '250px', // Same as sidebar width
        padding: '24px 32px',
        transition: 'all 0.3s ease',
        width: 'calc(100% - 250px)'
      }}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
