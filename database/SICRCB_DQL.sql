-- Requerimientos
-- ¿Cuantos usuarios hay registrados?
SELECT COUNT(*) AS total_usuarios
FROM usuario;

-- Listar todos los usuarios con su email y estado
SELECT id, email, estado
FROM usuario;

-- Listar todos los roles disponibles
SELECT id, nombre
FROM rol;

-- Listar todos los tipos de documento
SELECT sigla, nombre_documento, estado
FROM tipo_documento;

-- Listar todos los bloques
SELECT id, nombre
FROM bloque;

-- Listar todos los interiores con su bloque
SELECT b.nombre AS bloque, i.numero AS interior
FROM interior i
INNER JOIN bloque b ON b.id = i.id_bloque
ORDER BY b.nombre, i.numero;

-- Listar todos los apartamentos con su interior y bloque
SELECT b.nombre AS bloque, i.numero AS interior, ap.numero AS apartamento, ap.estado
FROM apartamento ap
INNER JOIN interior i ON i.id = ap.id_interior
INNER JOIN bloque b ON b.id = i.id_bloque
ORDER BY b.nombre, i.numero, ap.numero;

-- ¿Cuantos propietarios hay?
SELECT COUNT(*) AS total_propietarios
FROM propietario;

-- Listar todos los tipos de multa con su valor
SELECT numero, descripcion, valor, estado
FROM tipo_multa;

-- ¿Cuantas multas hay en total?
SELECT COUNT(*) AS total_multas
FROM multa;

-- Listar todas las multas con nombre y estado
SELECT numero, nombre, descripcion, estado
FROM multa;

-- Listar todas las PQRs con título, estado y fecha
SELECT id, titulo_pqr, estado, fecha
FROM queja_sugerencia
ORDER BY fecha DESC;

-- ¿Cuantas PQRs hay en total?
SELECT COUNT(*) AS total_pqrs
FROM queja_sugerencia;

-- Listar todas las noticias con estado y fecha
SELECT id, estado, fecha_publicacion
FROM noticia
ORDER BY fecha_publicacion DESC;

-- ¿Cuantos alquileres hay registrados?
SELECT COUNT(*) AS total_alquileres
FROM alquiler;

-- Listar todos los alquileres con hora y estado
SELECT id, descripcion, hora_inicio, hora_fin, valor_hora, estado
FROM alquiler
ORDER BY hora_inicio DESC;

-- Listar los salones comunales y su estado
SELECT id, estado
FROM salon_comunal;


-- Listar las sillas con su cantidad y estado
SELECT id, cantidad, estado
FROM silla;

-- Propietarios con su nombre completo
SELECT ud.numero_documento, ud.primer_nombre, ud.primer_apellido, p.estado
FROM propietario p
INNER JOIN user_data ud ON ud.id = p.id_user_data;

-- Administradores con su nombre completo
SELECT ud.numero_documento, ud.primer_nombre, ud.primer_apellido, a.fecha_inicio, a.estado
FROM administrador a
INNER JOIN user_data ud ON ud.id = a.id_user_data;

-- Apartamentos con su propietario actual
SELECT ap.numero AS apartamento, ud.primer_nombre, ud.primer_apellido, pga.fecha_registro, pga.estado
FROM propietario_gestion_apartamento pga
INNER JOIN propietario p ON p.id = pga.id_propietario
INNER JOIN user_data ud ON ud.id = p.id_user_data
INNER JOIN apartamento ap ON ap.id = pga.id_apartamento;

-- Consultar todos los usuarios con su información personal 
SELECT * 
FROM user_data;

-- Consultar usuario específico por número de cédula
SELECT  tp.sigla, ud.*
FROM user_data ud
INNER JOIN tipo_documento tp ON ud.id_tipo_documento = tp.id
WHERE numero_documento = 1001234567 AND tp.sigla = "CC";
 
-- Consultar quejas y sugerencias realizadas 
SELECT *
FROM queja_sugerencia;

-- Valor agregado 
-- ¿Quién genera las PQRsy cuándo?
SELECT tp.sigla, ud.numero_documento, ud.primer_nombre, ud.primer_apellido, pqr.descripcion_pqr, pqr.titulo_pqr, pqr.estado, pqr.fecha, pqr.evidencias
FROM propietario p
INNER JOIN user_data ud ON ud.id = p.id_user_data
INNER JOIN queja_sugerencia pqr ON p.id = pqr.id_propietario
INNER JOIN tipo_documento tp ON ud.id_tipo_documento = tp.id;

-- ¿Qué apartamentos tienen multas? 
SELECT b.nombre, i.numero, ap.numero, m.numero, m.nombre, m.descripcion, m.estado, m.evidencia, tm.numero, tm.descripcion, tm.valor
FROM interior i
INNER JOIN bloque b ON b.id = i.id_bloque
INNER JOIN apartamento ap ON i.id = ap.id_interior
INNER JOIN multa m ON ap.id = m.id_apartamento
INNER JOIN tipo_multa tm ON m.id_tipo_multa = tm.id;

-- ¿Qué apartamentos han pagado las multas? 
SELECT b.nombre, i.numero, ap.numero, m.numero, m.nombre, m.descripcion, m.estado, m.evidencia, tm.numero, tm.descripcion, tm.valor
FROM interior i
INNER JOIN bloque b ON b.id = i.id_bloque
INNER JOIN apartamento ap ON i.id = ap.id_interior
INNER JOIN multa m ON ap.id = m.id_apartamento
INNER JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
WHERE m.estado = "Pagado";

-- Propietario con su apartamento, interior y bloque
SELECT b.nombre, i.numero, ap.numero, ud.numero_documento, ud.primer_nombre, ud.primer_apellido
FROM bloque b
INNER JOIN interior i ON b.id = i.id_bloque
INNER JOIN apartamento ap ON i.id = ap.id_interior
INNER JOIN propietario_gestion_apartamento pgp ON pgp.id_apartamento = ap.id
INNER JOIN propietario p ON p.id = pgp.id_propietario
INNER JOIN user_data ud ON p.id_user_data = ud.id;

-- ¿Cuántos propietarios hay en general? 
SELECT r.nombre, COUNT(ru.id_rol) AS Total 
FROM rol_usuario ru
INNER JOIN rol r ON r.id = ru.id_rol
WHERE ru.id_rol = 2;

-- ¿Quiénes han realizado alquileres? 
SELECT tp.sigla, ud.numero_documento, ud.primer_nombre, ud.primer_apellido
FROM tipo_documento tp
INNER JOIN user_data ud ON ud.id_tipo_documento = tp.id
INNER JOIN propietario p ON p.id_user_data = ud.id
INNER JOIN alquiler a ON p.id = a.id_propietario;

-- Noticias por fecha y autor 
SELECT tp.sigla, ud.numero_documento, ud.primer_nombre, ud.primer_apellido, n.fecha_publicacion
FROM tipo_documento tp
INNER JOIN user_data ud ON ud.id_tipo_documento = tp.id
INNER JOIN administrador ad ON ad.id_user_data = ud.id
INNER JOIN noticia n ON ad.id = n.id_administrador;

SELECT tp.sigla, ud.numero_documento, ud.primer_nombre, ud.primer_apellido
FROM tipo_documento tp
INNER JOIN user_data ud ON ud.id_tipo_documento = tp.id
INNER JOIN administrador ad ON ad.id_user_data = ud.id
INNER JOIN noticia n ON ad.id = n.id_administrador;

SELECT n.fecha_publicacion
FROM tipo_documento tp
INNER JOIN user_data ud ON ud.id_tipo_documento = tp.id
INNER JOIN administrador ad ON ad.id_user_data = ud.id
INNER JOIN noticia n ON ad.id = n.id_administrador;

-- Usuarios por rol del sistema 
SELECT tp.sigla, ud.numero_documento, ud.primer_nombre, ud.primer_apellido, r.nombre
FROM tipo_documento tp
INNER JOIN user_data ud ON ud.id_tipo_documento = tp.id
INNER JOIN usuario u ON u.id = ud.id_usuario
INNER JOIN rol_usuario ru ON ru.id_user = u.id
INNER JOIN rol r ON r.id = ru.id_rol;

-- Multas agrupadas por tipo 
SELECT tp.numero, COUNT(m.id) AS total_multas
FROM multa m
INNER JOIN tipo_multa tp ON tp.id = m.id_tipo_multa
GROUP BY tp.numero;

-- Alquileres con sillas incluidas 
SELECT a.descripcion, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado, s.cantidad
FROM salon_comunal sc
INNER JOIN alquiler a ON sc.id = a.id_salon_comunal
INNER JOIN alquiler_silla asi ON asi.id_alquiler = a.id
INNER JOIN silla s ON s.id = asi.id_silla;

-- Alquileres con solo sillas
SELECT a.descripcion, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado, s.cantidad
FROM alquiler a
INNER JOIN alquiler_silla asi ON asi.id_alquiler = a.id
INNER JOIN silla s ON s.id = asi.id_silla;
