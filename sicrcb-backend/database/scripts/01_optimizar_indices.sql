-- sicrcb-backend/database/scripts/01_optimizar_indices.sql
-- Script de optimización de índices para Fase 1.1 (Optimización de la Base de Datos)
-- Generado basado en el análisis de consultas en los repositorios

-- =============================================
-- ÍNDICES PARA TABLA USUARIO
-- =============================================

-- Índice para búsquedas por email (login y recuperación de contraseña)
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);

-- Índice para verificar estado de usuario (común en consultas)
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON usuario(estado);

-- Índice compuesto para login (email y estado)
CREATE INDEX IF NOT EXISTS idx_usuario_email_estado ON usuario(email, estado);

-- =============================================
-- ÍNDICES PARA TABLA USER_DATA
-- =============================================

-- Índice para número de documento (búsquedas y verificaciones de unicidad)
CREATE INDEX IF NOT EXISTS idx_user_data_numero_documento ON user_data(numero_documento);

-- Índice compuesto para verificaciones de unicidad (documento + tipo)
CREATE INDEX IF NOT EXISTS idx_user_data_documento_tipo ON user_data(numero_documento, id_tipo_documento);

-- Índice para tipos de documento activos (usado en joins y filtros)
CREATE INDEX IF NOT EXISTS idx_tipo_documento_estado ON tipo_documento(estado);

-- =============================================
-- ÍNDICES PARA TABLA ROL_USUARIO Y ROL
-- =============================================

-- Índices foreign keys para rol_usuario
CREATE INDEX IF NOT EXISTS idx_rol_usuario_id_user ON rol_usuario(id_user);
CREATE INDEX IF NOT EXISTS idx_rol_usuario_id_rol ON rol_usuario(id_rol);

-- =============================================
-- ÍNDICES PARA TABLA PROPIETARIO
-- =============================================

-- Índice foreign key para user_data
CREATE INDEX IF NOT EXISTS idx_propietario_id_user_data ON propietario(id_user_data);

-- =============================================
-- ÍNDICES PARA TABLA PROPIETARIO_GESTION_APARTAMENTO
-- =============================================

-- Índices foreign keys
CREATE INDEX IF NOT EXISTS idx_pga_id_propietario ON propietario_gestion_apartamento(id_propietario);
CREATE INDEX IF NOT EXISTS idx_pga_id_apartamento ON propietario_gestion_apartamento(id_apartamento);

-- Índice para estado (filtrado común de apartamentos activos)
CREATE INDEX IF NOT EXISTS idx_pga_estado ON propietario_gestion_apartamento(estado);

-- Índice compuesto para consultas de asignaciones activas
CREATE INDEX IF NOT EXISTS idx_pga_propietario_apartamento_estado ON propietario_gestion_apartamento(id_propietario, id_apartamento, estado);

-- =============================================
-- ÍNDICES PARA TABLA APARTAMENTO, INTERIOR Y BLOQUE
-- =============================================

-- Índice para estado de apartamento (filtrado común)
CREATE INDEX IF NOT EXISTS idx_apartamento_estado ON apartamento(estado);

-- Índices foreign keys para joins (eliminados índices en PK ya que MySQL los crea automáticamente)
-- CREATE INDEX IF NOT EXISTS idx_interior_id ON interior(id);  -- PK
-- CREATE INDEX IF NOT EXISTS idx_bloque_id ON bloque(id);     -- PK

-- Índice para joins entre apartamento, interior y bloque
CREATE INDEX IF NOT EXISTS idx_apartamento_interior ON apartamento(id_interior);
CREATE INDEX IF NOT EXISTS idx_interior_bloque ON interior(id_bloque);

-- =============================================
-- ÍNDICES PARA TABLA ALQUILER
-- =============================================

-- Índices foreign keys
CREATE INDEX IF NOT EXISTS idx_alquiler_id_propietario ON alquiler(id_propietario);
CREATE INDEX IF NOT EXISTS idx_alquiler_id_salon_comunal ON alquiler(id_salon_comunal);

-- Índices para consultas de rango de tiempo (muy comunes en alquileres)
CREATE INDEX IF NOT EXISTS idx_alquiler_hora_inicio ON alquiler(hora_inicio);
CREATE INDEX IF NOT EXISTS idx_alquiler_hora_fin ON alquiler(hora_fin);
CREATE INDEX IF NOT EXISTS idx_alquiler_hora_inicio_hora_fin ON alquiler(hora_inicio, hora_fin);

-- Índice para estado (filtrado común)
CREATE INDEX IF NOT EXISTS idx_alquiler_estado ON alquiler(estado);

-- Índice compuesto para consultas de disponibilidad por rango de tiempo y estado
CREATE INDEX IF NOT EXISTS idx_alquiler_hora_inicio_hora_fin_estado ON alquiler(hora_inicio, hora_fin, estado);

-- =============================================
-- ÍNDICES PARA TABLA ALQUILER_SILLA
-- =============================================

-- Índices foreign keys
CREATE INDEX IF NOT EXISTS idx_alquiler_silla_id_alquiler ON alquiler_silla(id_alquiler);
CREATE INDEX IF NOT EXISTS idx_alquiler_silla_id_silla ON alquiler_silla(id_silla);

-- Índice compuesto para consultas de sillas por alquiler
CREATE INDEX IF NOT EXISTS idx_alquiler_silla_alquiler_silla ON alquiler_silla(id_alquiler, id_silla);

-- =============================================
-- ÍNDICES PARA TABLA SALON_COMUNAL Y SILLA
-- =============================================

-- Índices primarios (eliminados índices en PK ya que MySQL los crea automáticamente)
-- CREATE INDEX IF NOT EXISTS idx_salon_comunal_id ON salon_comunal(id);  -- PK
-- CREATE INDEX IF NOT EXISTS idx_silla_id ON silla(id);                 -- PK

-- =============================================
-- ÍNDICES ADICIONALES PARA MEJORAR SUBQUERYS Y JOINS COMPLEJOS
-- =============================================

-- Índice FULLTEXT para optimizar subconsulta en AdminUsuarioRepository.listarUsuarios
-- (búsqueda en usuario_data con LIKE en múltiples campos - ahora efectivo con comodines iniciales)
CREATE FULLTEXT INDEX IF NOT EXISTS idx_user_data_nombres_apellidos ON user_data(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido);

-- Índice para optimizar búsqueda por email en subconsultas
CREATE INDEX IF NOT EXISTS idx_usuario_email_id ON usuario(email, id);

-- =============================================
-- NOTAS DE IMPLEMENTACIÓN
-- =============================================
--
-- 1. Ejecutar este script durante horas de baja actividad para minimizar impacto
-- 2. Monitorear el rendimiento después de crear los índices
-- 3. Algunos índices pueden ser duplicados si ya existen claves primarias o únicas
-- 4. Los índices en columnas de clave primaria fueron eliminados ya que MySQL los crea automáticamente
-- 5. Se cambió a FULLTEXT INDEX para búsquedas efectivas con comodines iniciales en campos de texto
-- 6. Considerar el uso de EXPLAIN ANALYZE para verificar el uso de los índices
-- 7. Ajustar según el volumen real de datos y patrones de consulta observados
--
-- =============================================
-- FIN DEL SCRIPT
-- =============================================