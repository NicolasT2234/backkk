import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/styles.css";
import "../../assets/css/multas.css";
import "../../assets/css/multa-residente.css";
import api from "../../services/api";
import Footer from "../../components/Footer";
import NavbarApp from "../../components/NavbarApp";
import { Spinner, Alert, Badge } from "react-bootstrap";

const ESTADOS = {
  pendiente: { label: "Pendiente", bg: "warning" },
  pagada: { label: "Pagada", bg: "success" },
  vencida: { label: "Vencida", bg: "danger" },
  anulada: { label: "Anulada", bg: "secondary" },
};

function EstadoBadge({ estado }) {
  const info = ESTADOS[estado] || { label: estado, bg: "dark" };
  const className = `badge-${estado}`;
  return <Badge className={className}>{info.label}</Badge>;
}

export default function MisMultas() {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  useEffect(() => {
    const fetchMultas = async () => {
      try {
        const res = await api.get("/multas/mis-multas");
        setMultas(res.data);
      } catch (err) {
        console.error("Error al cargar multas:", err);
        setError("No se pudieron cargar las multas.");
      } finally {
        setLoading(false);
      }
    };

    fetchMultas();
  }, []);

  if (loading) {
    return (
      <div className="multas-page">
        <NavbarApp onLogout={handleLogout} />
        <div className="container py-4" style={{ flex: "1 0 auto" }}>
          <h3
            style={{ color: "rgb(140, 50, 0)" }}
            className="mb-4 fw-bold"
          >
            Mis Multas
          </h3>
          <div className="text-center py-5">
            <Spinner
              animation="border"
              style={{ color: "rgb(140, 50, 0)" }}
            />
          </div>
        </div>
        <Footer style={{ marginTop: "auto" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="multas-page">
        <NavbarApp onLogout={handleLogout} />
        <div className="container py-4" style={{ flex: "1 0 auto" }}>
          <h3
            style={{ color: "rgb(140, 50, 0)" }}
            className="mb-4 fw-bold"
          >
            Mis Multas
          </h3>
          <div className="text-center py-5">
            <Alert variant="danger">{error}</Alert>
          </div>
        </div>
        <Footer style={{ marginTop: "auto" }} />
      </div>
    );
  }

  return (
    <div className="multas-page">
      <NavbarApp onLogout={handleLogout} />
      <div className="container py-4" style={{ flex: "1 0 auto" }}>
        <h3
          style={{ color: "rgb(140, 50, 0)" }}
          className="mb-4 fw-bold"
        >
          Mis Multas
        </h3>

        {multas.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted" style={{ fontSize: "1.1rem" }}>
              No tienes multas pendientes
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {multas.map((m) => (
              <div key={m.id} className="col-md-6 col-lg-4">
                <div className="multa-card h-100">
                  <div className="multa-card-header">
                    <h5 className="multa-title mb-2">{m.nombre}</h5>
                    <div className="multa-meta">
                      <span className="multa-number">#{m.numero}</span>
                      <span className="multa-estado">
                        <EstadoBadge estado={m.estado} />
                      </span>
                    </div>
                  </div>
                  <div className="multa-card-body">
                    <p className="multa-description">{m.descripcion}</p>
                    <div className="multa-details">
                      <div className="multa-detail-item">
                        <span className="detail-label">Monto:</span>
                        <span className="detail-value">${Number(m.monto).toLocaleString("es-CO")}</span>
                      </div>
                      <div className="multa-detail-item">
                        <span className="detail-label">Estado:</span>
                        <span className="detail-value">
                          <EstadoBadge estado={m.estado} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer style={{ marginTop: "auto" }} />
    </div>
  );
}