import React from 'react';
import styles from './MetricsGrid.module.css';
import { Home, FileText, Users, MessageSquare } from "lucide-react";

const MetricsGrid = ({
  stats,
  navigate
}) => {
  return (
    <section className={styles.metricsGrid}>
      <div
        className={styles.metricCard}
        onClick={() => navigate("/alquiler")}
      >
        <div className={styles.iconBox}>
          <Home size={26} />
        </div>
        <div className={styles.infoBox}>
          <span className={styles.label}>Reservas Activas</span>
          <span className={styles.value}>{stats.alquileresActivos}</span>
          <span className={styles.subtext}>Salón y mobiliario</span>
        </div>
      </div>

      <div
        className={`${styles.metricCard} ${styles.warningCard}`}
        onClick={() => navigate("/multas")}
      >
        <div className={styles.iconBox}>
          <FileText size={26} />
        </div>
        <div className={styles.infoBox}>
          <span className={styles.label}>Multas Pendientes</span>
          <span className={styles.value}>{stats.multasPendientes}</span>
          <span className={styles.subtext}>Por conciliar</span>
        </div>
      </div>

      <div
        className={`${styles.metricCard} ${styles.successCard}`}
        onClick={() => navigate("/registro")}
      >
        <div className={styles.iconBox}>
          <Users size={26} />
        </div>
        <div className={styles.infoBox}>
          <span className={styles.label}>Propietarios</span>
          <span className={styles.value}>{stats.totalPropietarios}</span>
          <span className={styles.subtext}>Censo residencial</span>
        </div>
      </div>

      <div
        className={`${styles.metricCard} ${styles.infoCard}`}
        onClick={() => navigate("/pqrs")}
      >
        <div className={styles.iconBox}>
          <MessageSquare size={26} />
        </div>
        <div className={styles.infoBox}>
          <span className={styles.label}>PQRS Pendientes</span>
          <span className={styles.value}>{stats.pqrsPendientes}</span>
          <span className={styles.subtext}>Requieren atención</span>
        </div>
      </div>
    </section>
  );
};

export default MetricsGrid;