import React from 'react';
import styles from './ActionButton.module.css';

const ActionButton = ({
  leftIcon,
  text,
  onClick,
  rightIcon = null,
  disabled = false,
  className = ''
}) => {
  const handleClick = (e) => {
    if (disabled || !onClick) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  // Default right icon is ChevronRight if not provided
  const RightIcon = rightIcon || null;

  return (
    <button
      className={`${styles.actionButton} ${disabled && styles.disabled} ${className}`}
      onClick={handleClick}
      disabled={disabled || !onClick}
    >
      <div className={styles.iconLeft}>
        {leftIcon}
      </div>
      <span className={styles.buttonText}>{text}</span>
      {RightIcon && (
        <div className={styles.iconRight}>
          <RightIcon size={16} />
        </div>
      )}
    </button>
  );
};

export default ActionButton;