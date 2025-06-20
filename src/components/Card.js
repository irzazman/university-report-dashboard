import React from 'react';
import { cardStyles, typography, colors } from '../styles/GlobalStyles';

const Card = ({ title, children, className = "", style = {}, titleRight = null }) => (
  <div 
    className={`ui-card ${className}`}
    style={{ 
      ...cardStyles.default,
      ...style 
    }}
  >
    {title && (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3 style={{ 
          fontSize: typography.fontSizes.lg,
          fontWeight: typography.fontWeights.semibold,
          color: colors.darkText,
          margin: 0
        }}>{title}</h3>
        {titleRight && (
          <div className="card-title-right">
            {titleRight}
          </div>
        )}
      </div>
    )}
    {children}
  </div>
);

export default Card;
