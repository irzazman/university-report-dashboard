// Global style constants for consistent UI across the application
export const colors = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  warning: '#f72585',
  info: '#4895ef',
  accent: '#560bad',
  chartColors: ['#4361ee', '#f72585', '#4cc9f0', '#4895ef', '#560bad', '#3f37c9', '#7209b7', '#b5179e'],
  lightBg: '#f8f9fa',
  darkText: '#212529',
  lightBorder: '#e9ecef'
};

// Typography
export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '28px'
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8
  }
};

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px'
};

// Common button styles
export const buttonStyles = {
  primary: {
    background: colors.primary,
    color: '#fff',
    border: 'none',
    fontWeight: typography.fontWeights.semibold,
    boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)',
  },
  secondary: {
    background: '#fff',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    fontWeight: typography.fontWeights.medium,
  },
  warning: {
    background: colors.warning,
    color: '#fff',
    border: 'none',
    fontWeight: typography.fontWeights.semibold,
    boxShadow: '0 4px 12px rgba(247, 37, 133, 0.2)',
  },
  success: {
    background: colors.success,
    color: '#fff',
    border: 'none',
    fontWeight: typography.fontWeights.semibold,
    boxShadow: '0 4px 12px rgba(76, 201, 240, 0.2)',
  },
  info: {
    background: colors.info,
    color: '#fff',
    border: 'none',
    fontWeight: typography.fontWeights.semibold,
    boxShadow: '0 4px 12px rgba(72, 149, 239, 0.2)',
  },
  // Button sizes
  sizes: {
    sm: {
      padding: '6px 12px',
      fontSize: typography.fontSizes.xs,
      borderRadius: '6px',
    },
    md: {
      padding: '10px 20px',
      fontSize: typography.fontSizes.sm,
      borderRadius: '8px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: typography.fontSizes.md,
      borderRadius: '10px',
    }
  }
};

// Card styles
export const cardStyles = {
  default: {
    background: '#fff',
    borderRadius: '12px',
    padding: spacing.lg,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  }
};

// Form styles
export const formStyles = {
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.lightBorder}`,
    fontSize: typography.fontSizes.sm,
    transition: 'all 0.2s',
    outline: 'none',
    width: '100%',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.lightBorder}`,
    fontSize: typography.fontSizes.sm,
    transition: 'all 0.2s',
    outline: 'none',
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: spacing.sm,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.darkText
  }
};

// Media query helper
export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs})`,
  sm: `@media (max-width: ${breakpoints.sm})`,
  md: `@media (max-width: ${breakpoints.md})`,
  lg: `@media (max-width: ${breakpoints.lg})`,
  xl: `@media (max-width: ${breakpoints.xl})`,
};

// CSS to inject for responsiveness
export const responsiveStyles = `
  @media (max-width: ${breakpoints.sm}) {
    .dashboard-container {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100% !important;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: auto !important;
      padding: 8px 0;
    }
    
    .sidebar-header {
      display: none !important;
    }
    
    .main-content {
      margin-left: 0 !important;
      padding: 16px !important;
      margin-bottom: 60px !important; /* Space for mobile nav */
    }
    
    .mobile-menu {
      display: flex !important;
    }
    
    .sidebar-menu {
      display: none !important;
    }
    
    .mobile-menu-open .sidebar-menu {
      display: block !important;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 60px;
      background: white;
      z-index: 1001;
      padding: 16px;
      overflow-y: auto;
    }
  }
  
  @media (min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.lg}) {
    .dashboard-container {
      flex-direction: row;
    }
    
    .sidebar {
      width: 72px !important;
    }
    
    .sidebar-menu ul li span:not([role="img"]) {
      display: none !important;
    }
    
    .sidebar-menu .menu-title {
      display: none !important;
    }
    
    .main-content {
      margin-left: 72px !important;
    }
    
    .sidebar-header .admin-label {
      display: none !important;
    }
  }
`;
