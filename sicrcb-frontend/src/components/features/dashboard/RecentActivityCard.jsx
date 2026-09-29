import React from 'react';
import styles from './RecentActivityCard.module.css';
import { Activity, FileText, MessageSquare, MapPin, User } from "lucide-react";

const RecentActivityCard = ({
  actividades = []
}) => {
  // Formateador de tiempo relativo para la actividad
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Hace un momento";
    const now = new Date();
    const past = new Date(dateString);
    const diffMinutes = Math.floor((now - past) / 60000);

    if (diffMinutes < 1) return "Hace unos segundos";
    if (diffMinutes < 60) return `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  };

  const renderActivityIcon = (tipo) => {
    switch (tipo) {
      case "multa":
        return <FileText size={18} />;
      case "pqr":
        return <MessageSquare size={18} />;
      case "alquiler":
        return <MapPin size={18} />;
      case "residente":
      default:
        return <User size={18} />;
    }
  };

  return (
    <div className={styles.activityCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <Activity size={20} color="#8c3200" />
          <h3>Actividad Reciente en la Copropiedad</h3>
        </div>
        <span className={styles.cardHeaderBadge}>
          <span
            className={styles.badgeDot}
            style={{ backgroundColor: "#10b981" }}
          />
          Tiempo Real
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.timeline}>
          {actividades.length > 0 ? (
            actividades.map(item => (
              <div className={styles.timelineItem} key={item.id}>
                <div className={styles.timelineIcon}>
                  {renderActivityIcon(item.tipo)}
                </div>
                <div className={styles.timelineContent}>
                  <p className={styles.timelineDesc}>
                    <strong>{item.titulo}</strong>
                    <br />
                    <small className={styles.timelineDetail}>{item.detalle}</small>
                  </p>
                  <span className={styles.timelineTime}>
                    {formatRelativeTime(item.fecha)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              Sin actividad reciente registrada en el sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityCard;