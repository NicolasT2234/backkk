import { Container, Row, Col, Card, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom"
import { JournalText, Building, ChatLeftText } from "react-bootstrap-icons";
import "../assets/css/styles.css"
import "../assets/css/home.css"
import Logo from "../assets/img/Logo_SICRCB_dark_bg.png"

function Home() {
  const navigate = useNavigate()

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4">Sistema Integral de Control y Registro Comunal</h1>
              <p className="lead">
                Plataforma integral para la gestión integral de tu comunidad residencial.
                Administra multas, alquileres, notificaciones y PQRS desde un solo lugar.
              </p>
              <Button
                size="lg"
                variant={null}
                className="btn-outline-custom me-3"
                onClick={() => navigate("/login")}
              >
                Iniciar Sesión
              </Button>
              <Button
                size="lg"
                variant={null}
                className="btn-outline-custom"
                onClick={() => navigate("/registro")}
              >
                Registrarse
              </Button>
            </Col>
            <Col md={6}>
              <Image
                src={Logo}
                alt="Sistema SICRCB"
                className="img-fluid rounded"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="mb-4">¿Qué puedes hacer con SICRCB?</h2>
            <p className="lead text-muted">
              Todas las herramientas que necesitas para gestionar tu comunidad de manera eficiente y transparente.
            </p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-4">
                    <JournalText size={40} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold">Gestión de Multas</Card.Title>
                  <Card.Text className="text-muted">
                    Registra, sigue y gestiona todas las multas de la comunidad de manera transparente y eficiente.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom"
                    onClick={() => navigate("/login")}
                  >
                    Ver Más
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-4">
                    <Building size={40} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold">Gestión de Alquileres</Card.Title>
                  <Card.Text className="text-muted">
                    Administra las reservas del salón comunal y sillas, lleva el control de disponibilidad y pagos.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom"
                    onClick={() => navigate("/login")}
                  >
                    Ver Más
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-4">
                    <ChatLeftText size={40} color="#F47820" />
                  </div>
                  <Card.Title className="fw-bold">Gestión de PQRS</Card.Title>
                  <Card.Text className="text-muted">
                    Recibe, gestiona y responde a las peticiones, Quejas, Reclamos y Sugerencias de los Residentes.
                  </Card.Text>
                  <Button
                    size="sm"
                    variant={null}
                    className="btn-outline-custom"
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

      {/* Call to Action */}
      <section className="cta-section py-5 text-center">
        <Container>
          <h2>¿Listo para transformar la gestión de tu comunidad?</h2>
          <p className="lead">
            Únete a nuestra plataforma y descubre cómo SICRCB puede hacer más fácil la administración de tu conjunto residencial.
          </p>
          <div>
            <Button
              size="lg"
              variant={null}
              className="btn-custom me-3"
              onClick={() => navigate("/registro")}
            >
              Comenzar Gratis
            </Button>
            <Button
              size="lg"
              variant={null}
              className="btn-outline-custom"
              onClick={() => navigate("/login")}
            >
              Iniciar Sesión
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}

export default Home