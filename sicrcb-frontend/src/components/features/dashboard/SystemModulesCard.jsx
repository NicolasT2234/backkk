import React from 'react';
import styles from './SystemModulesCard.module.css';
import { Layers, Newspaper } from "lucide-react";
import ActionButton from "../../ui/ActionButton.jsx";

const SystemModulesCard = ({
  isAdmin = false,
  navigate
}) => {
  return (
    <div className={styles.modulesCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <Layers size={20} color="#8c3200" />
          <h3>Módulos del Sistema</h3>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.actionsGrid}>
          {isAdmin && (
            <>
              <ActionButton
                leftIcon={<FileText size={18} />}
                text="Gestión de Multas"
                onClick={() => navigate("/multas")}
              />

              <ActionButton
                leftIcon={<MessageSquare size={18} />}
                text="Gestión de PQRS"
                onClick={() => navigate("/pqrs")}
              />

              <ActionButton
                leftIcon={<Newspaper size={18} />}
                text="Gestión de Noticias"
                onClick={() => navigate("/noticias")}
              />
            </>
          )}

          <ActionButton
            leftIcon={<Home size={18} />}
            text="Gestión de Alquileres"
            onClick={() => navigate("/alquiler")}
          />

          <ActionButton
            leftIcon={<User size={18} />}
            text="Registrar Usuario"
            onClick={() => navigate("/registro")}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemModulesCard;