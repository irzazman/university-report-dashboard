import React from 'react';
import { colors, typography, spacing } from '../styles/GlobalStyles';

const PageHeader = ({ 
  title, 
  subtitle = null, 
  actions = null, 
  breadcrumbs = null 
}) => {
  return (
    <header style={{ 
      marginBottom: spacing.xl,
    }}>
      {breadcrumbs && (
        <div style={{ 
          display: 'flex', 
          marginBottom: spacing.md, 
          fontSize: typography.fontSizes.sm,
          color: '#6c757d'
        }}>
          {breadcrumbs}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md
      }}>
        <div>
          <h1 style={{ 
            fontSize: typography.fontSizes.xxxl, 
            fontWeight: typography.fontWeights.bold, 
            color: colors.darkText,
            margin: 0,
            marginBottom: subtitle ? spacing.xs : 0
          }}>
            {title}
          </h1>
          
          {subtitle && (
            <div style={{ 
              fontSize: typography.fontSizes.md,
              color: '#6c757d'
            }}>
              {subtitle}
            </div>
          )}
        </div>
        
        {actions && (
          <div className="header-actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
