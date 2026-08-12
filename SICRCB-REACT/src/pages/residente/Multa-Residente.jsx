import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/styles.css";
import "../../assets/css/multas.css";
import "../../assets/css/multa-residente.css";
import api from "../../services/api";
import Footer from "../../components/Footer";
import NavbarApp from "../../components/NavbarApp";
import { Badge, Spinner, Alert, Table, Tabs, Tab } from "react-bootstrap";

const ESTADOS = {
  pendiente: { label: "Pendiente", bg: "warning" },
  pagada: { label: "Pagada", bg: "success" },
  vencida: { label: "Vencida", bg: "danger" },
  anulada: { label: "Anulada", bg: "secondary" },
};

function EstadoBadge({ estado }) {
  const info = ESTADOS[estado] || { label: estado, bg: "dark" };
  return <Badge bg={info.bg}>{info.label}</Badge>;
}

export default function MisMultas() {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("todas");

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

  const multasFiltradas = multas.filter((m) =>
    tab === "todas" ? true : m.estado === tab
  );

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

      <Tabs
        activeKey={tab}
        onSelect={(k) => setTab(k)}
        className="mb-3 custom-tabs"
      >
        <Tab eventKey="todas" title="Todas" />
        <Tab eventKey="pendiente" title="Pendientes" />
        <Tab eventKey="pagada" title="Pagadas" />
      </Tabs>

      {loading && (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{ color: "rgb(140, 50, 0)" }}
          />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <div
          className="table-responsive rounded"
          style={{ border: "1px solid #FFD0A0" }}
        >
          <Table hover className="mb-0 align-middle">
            <thead style={{ backgroundColor: "#FFD0A0" }}>
              <tr>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {multasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center text-muted py-4"
                  >
                    No tienes multas registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                multasFiltradas.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {new Date(m.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td>{m.motivo}</td>
                    <td>
                      ${Number(m.monto).toLocaleString("es-CO")}
                    </td>
                    <td>
                      <EstadoBadge estado={m.estado} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>

    <Footer style={{ marginTop: "auto" }} />
  </div>
);
}