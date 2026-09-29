import React from 'react';
import { Home, Building, Layers } from 'lucide-react';
import styles from './PerfilResidenceInfo.module.css';

const PerfilResidenceInfo = ({ residencia, esAdmin }) => {
  const getResidenceContent = () => {
    if (esAdmin) {
      return (
        <p className={styles.residenceAdminText}>
          Oficina de Administración General
        </p>
      );
    }

    return (
      <div className={styles.residencePillsRow}>
        <div className={styles.residencePill}>
          <span className={styles.pillLbl}>Bloque</span>
          <span className={styles.pillVal}>
            {residencia.bloque || '-'}
          </span>
        </div>
        <div className={styles.residencePill}>
          <span className={styles.pillLbl}>Interior</span>
          <span className={styles.pillVal}>
            {residencia.interior || '-'}
          </span>
        </div>
        <div className={`${styles.residencePill} ${styles.destaque}`}>
          <span className={styles.pillLbl}>Apto</span>
          <span className={styles.pillVal}>
            {residencia.apartamento || '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.residenciaBox}>
      <div className={styles.residenciaBoxHeader}>
        <Home size={15} />
        <span>Unidad Residencial</span>
      </div>
      {getResidenceContent()}
    </div>
  );
};

export default PerfilResidenceInfo;