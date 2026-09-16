import React, { useState } from 'react';
import { Lock, CheckCircle, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function ModalCambiarClave({ usuario, alCerrar }) {
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError('');

    if (nuevaClave.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setMensajeError('Las contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      // Usa el endpoint existente PUT /api/usuarios/me
      await api.put('/usuarios/me', {
        contraseña: nuevaClave.trim()
      });

      // Guardar en localStorage para no volver a mostrar el modal a este usuario
      localStorage.setItem(`clave_cambiada_${usuario.id}`, 'true');
      alert('¡Contraseña actualizada con éxito!');
      alCerrar();
    } catch (err) {
      setMensajeError(err.response?.data?.error || 'Error al actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '16px', padding: '2rem',
        maxWidth: '440px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#8c3200', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} color="#f47820" /> Actualiza tu Contraseña
          </h3>
          <button onClick={alCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#888" />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#735340', margin: '0 0 1.2rem 0' }}>
          Si iniciaste sesión con una clave provisional asignada por la administración, por tu seguridad define una contraseña personal.
        </p>

        {mensajeError && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {mensajeError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#8c3200' }}>NUEVA CONTRASEÑA</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#8c3200' }}>CONFIRMAR CONTRASEÑA</label>
            <input
              type="password"
              placeholder="Repite la contraseña"
              required
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
              style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.8rem' }}>
            <button
              type="button"
              onClick={alCerrar}
              style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Más tarde
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{ background: '#8c3200', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {guardando ? 'Guardando...' : 'Guardar Clave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}