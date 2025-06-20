import React from 'react';
import { formStyles, colors, typography, spacing } from '../styles/GlobalStyles';

const FormField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  options = [],
  error = null,
  style = {},
  labelStyle = {},
  inputStyle = {}
}) => {
  // Determine if this is a select input
  const isSelect = type === 'select';
  
  return (
    <div style={{ marginBottom: spacing.md, ...style }}>
      {label && (
        <label 
          htmlFor={name} 
          style={{ 
            ...formStyles.label,
            ...labelStyle
          }}
        >
          {label}
          {required && <span style={{ color: colors.warning, marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      {isSelect ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          style={{
            ...formStyles.select,
            ...inputStyle
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            ...formStyles.input,
            ...inputStyle
          }}
        />
      )}
      
      {error && (
        <div style={{ 
          color: colors.warning,
          fontSize: typography.fontSizes.xs,
          marginTop: spacing.xs
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
