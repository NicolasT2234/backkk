import React, { useState } from 'react';
import api from '../services/api';
import { Download } from 'lucide-react';

/**
 * Componente Reutilizable: BotonReporte
 * 
 * Permite descargar cualquier reporte en PDF actualizado al instante
 * desde la API de SICRCB con solo un clic.
 * 
 * Uso:
 * <BotonReporte 
 *   endpoint="/reportes/admin/multas-pdf" 
 *   nombreArchivo="Reporte_Multas_Admin.pdf" 
 *   texto="Generar Reporte" 
 * />
 */
const BotonReporte = ({ 
  endpoint = '/reportes/admin/multas-pdf', 
  nombreArchivo = 'Reporte_SICRCB.pdf', 
  texto = 'Generar Reporte',
  className = 'btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm'
}) => {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    try {
      setDescargando(true);

      // Petición al backend con responseType: 'blob' para recibir el archivo binario PDF
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      // Crear URL temporal del blob en memoria
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> invisible y disparar la descarga en el navegador
      const enlace = document.createElement('a');
      enlace.href = url;
      
      // Agregar fecha al nombre de archivo para identificarlo fácilmente
      const fechaStr = new Date().toISOString().slice(0, 10);
      const nombreFinal = nombreArchivo.replace('.pdf', `_${fechaStr}.pdf`);
      enlace.setAttribute('download', nombreFinal);
      
      document.body.appendChild(enlace);
      enlace.click();
      
      // Limpieza de memoria
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      alert('Ocurrió un error al generar el reporte. Verifica tu sesión o los permisos de usuario.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleDescargar}
      disabled={descargando}
      title="Descarga el reporte actualizado al instante"
    >
      {descargando ? (
        <>
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>Generando...</span>
        </>
      ) : (
        <>
          <Download size={16} />
          <span>{texto}</span>
        </>
      )}
    </button>
  );
};

export default BotonReporte;