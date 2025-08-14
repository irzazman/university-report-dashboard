# Component Library Documentation

## Overview
The University Report Dashboard includes a comprehensive set of reusable components designed for consistency, maintainability, and responsive design across the application.

## Design Principles
- **Consistency**: Uniform visual language and behavior
- **Reusability**: Components designed for multiple use cases
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsiveness**: Mobile-first design approach
- **Performance**: Optimized for minimal re-renders

## Component Catalog

### Layout Components
- [AppLayout](./AppLayout.md) - Main application wrapper
- [Sidebar](./Sidebar.md) - Navigation sidebar with responsive design
- [PageHeader](./PageHeader.md) - Consistent page headers

### UI Components
- [Card](./Card.md) - Content container component
- [Button](./Button.md) - Interactive button component
- [FormField](./FormField.md) - Form input component

## Global Design System

### Color Palette
```javascript
export const colors = {
  // Primary Colors
  primary: '#4361ee',        // Main brand color
  secondary: '#3f37c9',      // Secondary actions
  
  // Status Colors
  success: '#4cc9f0',        // Success states
  warning: '#f72585',        // Warning/error states
  info: '#4895ef',           // Information
  accent: '#560bad',         // Accent highlights
  
  // Neutral Colors
  lightBg: '#f8f9fa',        // Background
  darkText: '#212529',       // Primary text
  lightText: '#6c757d',      // Secondary text
  lightBorder: '#e9ecef',    // Borders
  white: '#ffffff'           // Pure white
};
```

### Typography
```javascript
export const typography = {
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px'
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};
```

### Spacing System
```javascript
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px'
};
```

### Breakpoints
```javascript
export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
};
```

## Usage Guidelines

### Component Import
```javascript
// Individual component imports
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';

// Design system imports
import { colors, typography, spacing } from '../styles/GlobalStyles';
```

### Styling Conventions
```javascript
// Inline styles (for dynamic values)
const dynamicStyle = {
  backgroundColor: isActive ? colors.primary : colors.lightBg,
  padding: spacing.md,
  fontSize: typography.fontSizes.md
};

// CSS classes (for static styles)
className="component-name component-name--modifier"
```

### Responsive Design Patterns
```javascript
// Mobile-first responsive styling
const responsiveStyles = {
  // Base (mobile) styles
  fontSize: typography.fontSizes.sm,
  padding: spacing.sm,
  
  // Tablet and up
  [`@media (min-width: ${breakpoints.tablet})`]: {
    fontSize: typography.fontSizes.md,
    padding: spacing.md
  },
  
  // Desktop and up
  [`@media (min-width: ${breakpoints.desktop})`]: {
    fontSize: typography.fontSizes.lg,
    padding: spacing.lg
  }
};
```

## Component Development Standards

### Props Interface
```javascript
// TypeScript-style prop documentation
interface ComponentProps {
  // Required props
  title: string;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  
  // Event handlers
  onClick?: (event: MouseEvent) => void;
  
  // Content props
  children?: React.ReactNode;
  
  // Style props
  className?: string;
  style?: React.CSSProperties;
}
```

### Component Template
```javascript
import React from 'react';
import { colors, typography, spacing } from '../styles/GlobalStyles';

const ComponentName = ({ 
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className = '',
  style = {},
  ...props
}) => {
  // Component logic here
  
  const baseStyles = {
    // Base component styles
  };
  
  const variantStyles = {
    primary: { /* primary variant styles */ },
    secondary: { /* secondary variant styles */ },
    outline: { /* outline variant styles */ }
  };
  
  const sizeStyles = {
    small: { /* small size styles */ },
    medium: { /* medium size styles */ },
    large: { /* large size styles */ }
  };
  
  const computedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(disabled && { opacity: 0.6, cursor: 'not-allowed' }),
    ...style
  };
  
  return (
    <div 
      className={`component-name ${className}`}
      style={computedStyles}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};

export default ComponentName;
```

## Testing Components

### Unit Test Template
```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  test('renders with required props', () => {
    render(<ComponentName title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<ComponentName title="Test" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Test'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('applies custom styles', () => {
    render(
      <ComponentName 
        title="Test" 
        style={{ backgroundColor: 'red' }}
        className="custom-class"
      />
    );
    
    const element = screen.getByText('Test').parentElement;
    expect(element).toHaveStyle('background-color: red');
    expect(element).toHaveClass('custom-class');
  });
  
  test('handles disabled state', () => {
    const handleClick = jest.fn();
    render(<ComponentName title="Test" disabled onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Test'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

## Accessibility Guidelines

### ARIA Support
```javascript
// Example accessible component
const AccessibleButton = ({ 
  children, 
  ariaLabel, 
  ariaDescribedBy,
  ...props 
}) => (
  <button
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    role="button"
    tabIndex={0}
    {...props}
  >
    {children}
  </button>
);
```

### Keyboard Navigation
```javascript
// Handle keyboard events
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
};
```

### Color Contrast
- All text meets WCAG AA standards (4.5:1 ratio)
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible

## Performance Optimization

### React.memo Usage
```javascript
import React, { memo } from 'react';

const ExpensiveComponent = memo(({ data, onAction }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});
```

### useCallback for Event Handlers
```javascript
const Component = ({ items, onItemClick }) => {
  const handleClick = useCallback((id) => {
    onItemClick(id);
  }, [onItemClick]);
  
  return (
    <div>
      {items.map(item => (
        <Item 
          key={item.id} 
          data={item} 
          onClick={() => handleClick(item.id)} 
        />
      ))}
    </div>
  );
};
```

## Component Guidelines

### When to Create a New Component
- **Reusability**: Used in 2+ places
- **Complexity**: Logic exceeds 50 lines
- **Separation of Concerns**: Distinct functionality
- **Testing**: Needs isolated testing

### Component Composition
```javascript
// Good: Composable components
<Card>
  <Card.Header>
    <Card.Title>Report Details</Card.Title>
    <Card.Actions>
      <Button variant="primary">Edit</Button>
      <Button variant="outline">Delete</Button>
    </Card.Actions>
  </Card.Header>
  <Card.Body>
    <FormField label="Title" value={title} />
    <FormField label="Description" value={description} />
  </Card.Body>
</Card>

// Avoid: Monolithic components
<ReportCard 
  title={title}
  description={description}
  showEdit={true}
  showDelete={true}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### State Management
```javascript
// Component-level state for UI concerns
const [isExpanded, setIsExpanded] = useState(false);
const [isLoading, setIsLoading] = useState(false);

// Props for business logic
const Component = ({ data, onSave, onCancel }) => {
  // Use props for external data and actions
  // Use state for internal UI state
};
```

## Documentation Standards

### Component Documentation Template
```javascript
/**
 * ComponentName - Brief description of the component
 * 
 * @example
 * <ComponentName 
 *   title="Example Title"
 *   variant="primary"
 *   onClick={handleClick}
 * >
 *   Content goes here
 * </ComponentName>
 * 
 * @param {string} title - The title to display
 * @param {string} [variant='primary'] - The visual variant
 * @param {function} [onClick] - Click event handler
 * @param {ReactNode} [children] - Child content
 */
```

## Migration Guide

### From Legacy Components
1. **Identify Usage**: Find all instances of old component
2. **Map Props**: Create prop mapping between old and new
3. **Test Coverage**: Ensure tests cover new implementation
4. **Gradual Migration**: Replace instances incrementally
5. **Cleanup**: Remove old component after migration

### Breaking Changes
- Document all breaking changes in CHANGELOG.md
- Provide migration guides for major updates
- Use deprecation warnings before removal
- Maintain backward compatibility when possible

## Contributing

### Adding New Components
1. Create component file in `/src/components/`
2. Follow naming convention: `ComponentName.js`
3. Add to component library documentation
4. Include unit tests
5. Update main exports

### Component Review Checklist
- [ ] Follows design system standards
- [ ] Includes proper prop validation
- [ ] Has accessibility features
- [ ] Includes unit tests
- [ ] Documentation is complete
- [ ] Performance is optimized
- [ ] Responsive design implemented