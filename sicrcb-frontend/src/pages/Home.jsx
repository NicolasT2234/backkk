import { Container, Row, Col, Card, Button, Image } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import {
  FileText as JournalText,
  Building2 as Building,
  MessageSquareText as ChatLeftText,
  Megaphone,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Clock,
  Phone
} from "lucide-react"
import "../assets/css/styles.css"
import "../assets/css/home.css"
import Logo from "../assets/img/Logo_SICRCB_dark_bg.png"
import Footer from "../components/Footer.jsx"

function Home() {
  const navigate = useNavigate()

  return (
    <>
      {/* =========================================================
          HERO SECTION (Diseño original SICRCB)
          ========================================================= */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center gy-4">
            <Col md={6}>
              <div className="hero-badge mb-3">
                <ShieldCheck className="me-2" size={16} />
                <span>Portal Institucional · Conjunto Residencial Casa Blanca</span>
              </div>
              <h1 className="display-4 fw-bold mb-3">
                Sistema Integral de Control y Registro Comunal
              </h1>
              <p className="lead hero-text mb-4">
                Plataforma digital para la gestión y convivencia de tu comunidad residencial.
                Consulta multas, reserva zonas comunes, revisa novedades y gestiona tus PQRS desde un solo lugar.
              </p>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <Button
                  size="lg"
                  variant={null}
                  className="btn-custom d-inline-flex align-items-center gap-2"
                  onClick={() => navigate("/login")}
                >
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={18} />
                </Button>
                <span className="hero-caption text-light-peach">
                  * Acceso exclusivo para residentes y administración
                </span>
              </div>
            </Col>
            <Col md={6} className="text-center">
              <div className="hero-image-wrapper">
                <Image
                  src={Logo}
                  alt="Sistema SICRCB - Casa Blanca"
                  className="img-fluid rounded hero-logo-img"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* =========================================================
          AVISO INSTITUCIONAL DE ACCESO CERRADO
          ========================================================= */}
      <div className="access-notice-bar py-3 text-center">
        <Container>
          <p className="mb-0 small fw-semibold">
            <strong>Acceso seguro y protegido:</strong> Por políticas de convivencia de Casa Blanca, las credenciales son asignadas directamente por la Administración.
          </p>
        </Container>
      </div>

      {/* =========================================================
          FEATURES SECTION (¿Qué puedes hacer con SICRCB?)
          ========================================================= */}
      <section className="features-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="mb-3 fw-bold section-title">¿Qué puedes hacer con SICRCB?</h2>
            <p className="lead text-muted mx-auto section-subtitle">
              Todas las herramientas que necesitas para gestionar tu copropiedad de manera eficiente, ágil y transparente.
            </p>
          </div>

          <Row className="g-4">
            {/* Gestión de Multas */}
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0 feature-card text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="feature-icon mb-4">
                    <JournalText size={38} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold mb-2">Gestión de Multas</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    Consulta infracciones, conceptos normativos, fechas y realiza seguimiento de acuerdos de pago de tu apartamento.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom mt-3"
                    onClick={() => navigate("/login")}
                  >
                    Ver Más
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Gestión de Alquileres */}
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0 feature-card text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="feature-icon mb-4">
                    <Building size={38} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold mb-2">Gestión de Alquileres</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    Verifica la disponibilidad del salón comunal y sillas en tiempo real, programando tus eventos sin traslapes.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom mt-3"
                    onClick={() => navigate("/login")}
                  >
                    Ver Más
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Gestión de PQRS */}
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0 feature-card text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="feature-icon mb-4">
                    <ChatLeftText size={38} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold mb-2">Gestión de PQRS</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    Radica peticiones, quejas, reclamos y sugerencias de forma oficial, con trazabilidad y respuesta del administrador.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom mt-3"
                    onClick={() => navigate("/login")}
                  >
                    Ver Más
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Cartelera y Noticias */}
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0 feature-card text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="feature-icon mb-4">
                    <Megaphone size={38} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold mb-2">Avisos y Noticias</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    Mantente informado sobre asambleas, circulares preventivas, fechas de mantenimiento y normas de convivencia.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom mt-3"
                    onClick={() => navigate("/login")}
                  >
                    Ver Más
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* =========================================================
          CALL TO ACTION CON DATOS DE CONTACTO INTEGRADOS
          ========================================================= */}
      <section className="cta-section py-5 text-center">
        <Container>
          <div className="cta-card p-4 p-md-5">
            <h2 className="mb-3 fw-bold">¿Eres residente o administrador de Casa Blanca?</h2>
            <p className="lead mb-4 mx-auto cta-lead-text">
              Ingresa al sistema para consultar tus servicios comunales, realizar reservas y enviar solicitudes en línea.
            </p>
            <div>
              <Button
                size="lg"
                variant={null}
                className="btn-custom"
                onClick={() => navigate("/login")}
              >
                Iniciar Sesión en el Portal
              </Button>
            </div>
            <p className="mt-3 mb-0 small text-muted">
              Si aún no cuentas con tus credenciales, solicítalas en la Oficina de Administración.
            </p>

            {/* Fila de Contacto Directo con el estilo de Casa Blanca */}
            <div className="mt-4 pt-3 border-top d-flex flex-wrap justify-content-center gap-4 text-start small text-muted">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={18} color="#F47820" />
                <span><strong style={{ color: "#8C3200" }}>Dirección:</strong> Calle 52 Sur #79B-15</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Clock size={18} color="#F47820" />
                <span><strong style={{ color: "#8C3200" }}>Horarios:</strong> Lun a Sáb: 8:00 a 12:00 y 2:00 a 4:00</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Phone size={18} color="#F47820" />
                <span>
                  <strong style={{ color: "#8C3200" }}>Contacto:</strong>{" "}
                  <a href="tel:+573208524187" style={{ color: "#F47820", fontWeight: "bold", textDecoration: "none" }}>
                    +57 320 8524187
                  </a>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================
          FOOTER INTEGRADO
          ========================================================= */}
      <Footer />
    </>
  )
}

export default Home