import React from 'react';
import styles from './SystemStatusCard.module.css';
import { Server, Database, Shield, Clock } from "lucide-react";

const SystemStatusCard = ({
  systemStatus,
  user,
  lastSync = new Date().toLocaleTimeString()
}) => {
  return (
    <div className={styles.statusCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <Server size={20} color="#8c3200" />
          <h3>Estado de la Plataforma</h3>
        </div>
        <span className={styles.cardHeaderBadge}>Servicios</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.healthGrid}>
          <div className={styles.healthNode}>
            <Server size={20} color={systemStatus.apiOk ? "#16a34a" : "#dc2626"} />
            <div className={styles.healthNodeInfo}>
              <small>API REST Express</small>
              <span>{systemStatus.apiOk ? "Conectado (200 OK)" : "Desconectado"}</span>
            </div>
          </div>

          <div className={styles.healthNode}>
            <Database size={20} color={systemStatus.dbOk ? "#16a34a" : "#dc2626"} />
            <div className={styles.healthNodeInfo}>
              <small>Base de Datos MySQL</small>
              <span>
                {systemStatus.dbOk
                    ? `Operativa (${systemStatus.dbLatencyMs}ms)`
                    : "Error de conexión"}
              </span>
            </div>
          </div>

          <div className={styles.healthNode}>
            <Shield size={20} color="#8c3200" />
            <div className={styles.healthNodeInfo}>
              <small>Sesión JWT</small>
              <span>{user?.rol || "Administrador"}</span>
            </div>
          </div>

          <div className={styles.healthNode}>
            <Clock size={20} color="#8c3200" />
            <div className={styles.healthNodeInfo}>
              <small>Última Sincronización</small>
              <span style={{ color: "#8c3200" }}>{lastSync}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusCard;