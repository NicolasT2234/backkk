// src/pages/AlquilerAdmin.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/styles.css";
import "../../assets/css/multas.css";
import "../../assets/css/alquiler-admin.css";
import api from "../../services/api";
import Footer from "../../components/Footer";
import NavbarApp from "../../components/NavbarApp";
import { Badge, Spinner, Alert, Table, Button, Form } from "react-bootstrap";

const ESTADOS = {
    pendiente: { label: "Pendiente", bg: "warning" },
    aprobada: { label: "Aprobada", bg: "success" },
    rechazada: { label: "Rechazada", bg: "danger" },
};

function EstadoBadge({ estado }) {
    const info = ESTADOS[estado] || { label: estado, bg: "dark" };
    return <Badge bg={info.bg}>{info.label}</Badge>;
}

function Iniciales({ nombre }) {
    const iniciales = nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
    return <span className="avatar-inicial">{iniciales || "?"}</span>;
}

function diasEsperando(fecha) {
    return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

const FILTROS = [
    { key: "todas", label: "Total" },
    { key: "pendiente", label: "Pendientes" },
    { key: "aprobada", label: "Aprobadas" },
    { key: "rechazada", label: "Rechazadas" },
];

export default function AlquilerAdmin() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState("pendiente");
    const [procesando, setProcesando] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    const handleLogout = () => navigate("/login");

    const normalizeSolicitudes = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.solicitudes)) return payload.solicitudes;
        if (Array.isArray(payload.reservas)) return payload.reservas;
        return [];
    };

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const res = await api.get("/alquileres");
                setSolicitudes(normalizeSolicitudes(res.data));
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar solicitudes:", err);
                setError("No se pudieron cargar las solicitudes de alquiler.");
                setLoading(false);
            }
        };
        fetchSolicitudes();
    }, []);

    const actualizarEstado = async (id, nuevoEstado) => {
        try {
            setProcesando(id);
            await api.put(`/alquileres/${id}`, { estado: nuevoEstado });
            setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s)));
        } catch (err) {
            console.error("Error al actualizar solicitud:", err);
            setError("No se pudo actualizar el estado de la solicitud.");
        } finally {
            setProcesando(null);
        }
    };

    const stats = useMemo(() => ({
        todas: solicitudes.length,
        pendiente: solicitudes.filter((s) => s.estado === "pendiente").length,
        aprobada: solicitudes.filter((s) => s.estado === "aprobada").length,
        rechazada: solicitudes.filter((s) => s.estado === "rechazada").length,
    }), [solicitudes]);

    const handleSeleccionTab = (key) => { setTab(key); setBusqueda(""); };

    const solicitudesFiltradas = solicitudes
        .filter((s) => (tab === "todas" ? true : s.estado === tab))
        .filter((s) => {
            const q = busqueda.trim().toLowerCase();
            if (!q) return true;
            return ((s.residente_nombre || "").toLowerCase().includes(q) || (s.espacio || "").toLowerCase().includes(q));
        });

    const filtroActivo = FILTROS.find((f) => f.key === tab);

    return (
        <div className="multas-page alquiler-admin-page">
            <NavbarApp onLogout={handleLogout} />
            <div className="container py-4" style={{ flex: "1 0 auto" }}>
                <h3 style={{ color: "rgb(140, 50, 0)" }} className="mb-4 fw-bold">Solicitudes de Alquiler</h3>

                <div className="alquiler-stats-grid">
                    {FILTROS.map((f) => (
                        <button key={f.key} type="button" className={`alquiler-stat-card stat-${f.key} ${tab === f.key ? "activa" : ""}`} onClick={() => handleSeleccionTab(f.key)}>
                            <span className="alquiler-stat-label">{f.label}</span>
                        </button>
                    ))}
                </div>

                <div className="alquiler-busqueda-row">
                    <Form.Control type="text" placeholder={`Buscar en ${filtroActivo?.label.toLowerCase()} por residente o espacio...`} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="alquiler-buscador" />
                </div>

                {loading && (
                    <div className="text-center py-5"><Spinner animation="border" style={{ color: "rgb(140, 50, 0)" }} /></div>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                {!loading && !error && (
                    <div className="table-responsive rounded" style={{ border: "1px solid #FFD0A0" }}>
                        <Table hover className="mb-0 align-middle">
                            <thead style={{ backgroundColor: "#FFD0A0" }}>
                                <tr><th>Residente</th><th>Espacio</th><th>Fecha</th><th>Estado</th><th className="text-end">Acciones</th></tr>
                            </thead>
                            <tbody>
                                {solicitudesFiltradas.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center text-muted py-4">{busqueda ? "Ningún resultado coincide con tu búsqueda." : "No hay solicitudes registradas en esta categoría."}</td></tr>
                                ) : (
                                    solicitudesFiltradas.map((s) => {
                                        const dias = diasEsperando(s.fecha);
                                        return (
                                            <tr key={s.id}>
                                                <td><span className="residente-cell"><Iniciales nombre={s.residente_nombre} />{s.residente_nombre}</span></td>
                                                <td>{s.espacio}</td>
                                                <td>
                                                    {new Date(s.fecha).toLocaleDateString("es-CO")}
                                                    {s.estado === "pendiente" && dias >= 2 && <div className="dias-espera">{dias} días esperando</div>}
                                                </td>
                                                <td><EstadoBadge estado={s.estado} /></td>
                                                <td className="text-end">
                                                    {s.estado === "pendiente" ? (
                                                        <div className="acciones-cell">
                                                            <Button variant="light" size="sm" className="btn-aprobar" disabled={procesando === s.id} onClick={() => actualizarEstado(s.id, "aprobada")}>{procesando === s.id ? "..." : "Aprobar"}</Button>
                                                            <Button variant="light" size="sm" className="btn-rechazar" disabled={procesando === s.id} onClick={() => actualizarEstado(s.id, "rechazada")}>{procesando === s.id ? "..." : "Rechazar"}</Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">Sin acciones</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}