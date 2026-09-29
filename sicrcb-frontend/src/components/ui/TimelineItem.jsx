import React from 'react';
import styles from './TimelineItem.module.css';

const TimelineItem = ({
  icon,
  title,
  detail,
  time
}) => {
  return (
    <div className={styles.timelineItem}>
      <div className={styles.timelineIcon}>
        {icon}
      </div>
      <div className={styles.timelineContent}>
        <p className={styles.timelineDesc}>
          <strong>{title}</strong>
          <br />
          <small className={styles.timelineDetail}>{detail}</small>
        </p>
        <span className={styles.timelineTime}>{time}</span>
      </div>
    </div>
  );
};

export default TimelineItem;