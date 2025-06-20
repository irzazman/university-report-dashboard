import React from 'react';
import { buttonStyles } from '../styles/GlobalStyles';

const Button = ({ 
  children, 
  type = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  className = '',
  style = {},
  icon = null
}) => {
  // Get the base style based on type and size
  const baseStyle = {
    ...buttonStyles[type],
    ...buttonStyles.sizes[size],
    opacity: disabled ? 0.7 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style
  };

  return (
    <button
      type="button"
      className={`ui-button ${className} btn-${type} btn-${size}`}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon" style={{ marginRight: children ? 8 : 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
