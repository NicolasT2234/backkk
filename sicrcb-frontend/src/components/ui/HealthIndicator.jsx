import React from 'react';
import styles from './HealthIndicator.module.css';

const HealthIndicator = ({
  icon,
  label,
  statusText,
  isOk,
  size = 20
}) => {
  return (
    <div className={styles.healthNode}>
      <div className={styles.iconContainer}>
        {React.cloneElement(icon, {
          size: size,
          color: isOk ? '#16a34a' : '#dc2626'
        })}
      </div>
      <div className={styles.info}>
        <small className={styles.label}>{label}</small>
        <span className={styles.statusText} style={{ color: isOk ? '#16a34a' : '#dc2626' }}>
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default HealthIndicator;