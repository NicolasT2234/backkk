import React from 'react';
import styles from './DashboardHeader.module.css';
import { Home, Server, RotateCw } from "lucide-react";
import BotonReporte from "../../BotonReporte.jsx";

const DashboardHeader = ({
  onGenerateReport,
  onRefresh,
  refreshing = false,
  lastSync = new Date().toLocaleTimeString()
}) => {
  return (
    <div className={styles.dashHero}>
      <div className={styles.dashHeroText}>
        <h1>
          <Home size={32} /> SICRCB Dashboard
        </h1>
        <p>Panel de control administrativo y gestión comunitaria de Casa Blanca</p>
      </div>
      <div className={styles.dashHeroActions}>
        <BotonReporte
          endpoint="/reportes/admin/resumen-ejecutivo-pdf"
          nombreArchivo="Informe_Ejecutivo_Mensual_Casa_Blanca.pdf"
          texto="Generar Informe Ejecutivo (PDF)"
          className="btn btn-warning d-inline-flex align-items-center gap-2 shadow-sm fw-bold text-dark px-3 py-2"
        />
        <button
          onClick={onRefresh}
          className={styles.refreshButton}
          title="Actualizar métricas ahora"
        >
          <RotateCw size={15} className={refreshing ? "spinning" : ""} />
          {refreshing ? "Sincronizando..." : "Sincronizar"}
        </button>
        <div className={styles.dashHeroBadge}>
          <Server size={16} /> Servidor y Base de Datos Operativos
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;