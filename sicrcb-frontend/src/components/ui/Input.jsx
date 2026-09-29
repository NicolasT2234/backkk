import React, { useId } from 'react';
import styles from './Input.module.css';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  readOnly = false,
  required = false,
  error = null,
  iconLeft = null,
  iconRight = null,
  className = '',
  ...rest
}) => {
  const id = useId();

  return (
    <div className={`${styles.inputWrapper} ${className}`}>
      {label && (
        <label
          className={styles.label}
          htmlFor={id}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputContainer}>
        {iconLeft && <span className={styles.inputIcon}>{iconLeft}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`${styles.input} ${error && styles.inputError}`}
          {...rest}
        />
        {iconRight && <span className={styles.inputIcon}>{iconRight}</span>}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

export default Input;