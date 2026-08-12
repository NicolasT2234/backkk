 -- DML 
 
 -- ROLES
INSERT INTO rol (nombre) 
VALUES 
('Administrador'),
('Propietario');

-- USUARIOS
INSERT INTO usuario (contraseña,email,estado,image_url)
VALUES
(sha2('admin123', 256),'admin@conjuntoresidencial1.com','Activo','admin123.jpg'),
(sha2('admin234', 256),'admin@conjuntoresidencial2.com','Activo','admin234.jpg'),
(sha2('prop101', 256),'carlos.ramirez@gmail.com','Activo','carlos.jpg'),
(sha2('prop102', 256),'laura.sanchez@gmail.com','Activo','laura.jpg'),
(sha2('prop103', 256),'andres.lopez@gmail.com','Inactivo','andres.jpg'),
(sha2('prop104', 256),'paula.moreno@gmail.com','Activo','paula.jpg'),
(sha2('prop105', 256),'daniel.torres@gmail.com','Activo','daniel.jpg'),
(sha2('prop106', 256),'camila.ruiz@gmail.com','Inactivo','camila.jpg'),
(sha2('prop107', 256),'sebastian.vargas@gmail.com','Activo','sebastian.jpg'),
(sha2('prop108', 256),'valentina.castro@gmail.com','Activo','valentina.jpg'),
(sha2('prop109', 256),'felipe.herrera@gmail.com','Activo','felipe.jpg'),
(sha2('prop110', 256),'natalia.reyes@gmail.com','Inactivo','natalia.jpg');


-- ROL USUARIO
INSERT INTO rol_usuario (id_user,id_rol)
VALUES
(1,1),
(2,2),
(3,2),
(4,2);

-- TIPOS DE DOCUMENTO
INSERT INTO tipo_documento (sigla,nombre_documento,estado)
VALUES
('CC','Cedula de Ciudadania','Activo'),
('CE','Cedula de Extranjeria','Activo');

-- DATOS DE USUARIO
INSERT INTO user_data
(numero_documento,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,id_usuario,id_tipo_documento)
VALUES
(1001234501,'Carlos','Eduardo','Ramirez','Lopez',3,1),
(1001234502,'Laura','Sofia','Sanchez','Martinez',4,1),
(1001234503,'Andres','Felipe','Lopez','Garcia',5,1),
(1001234504,'Paula','Andrea','Moreno','Diaz',6,1),
(1001234505,'Daniel','Alejandro','Torres','Ruiz',7,1),
(1001234506,'Camila','Fernanda','Ruiz','Castro',8,1),
(1001234507,'Sebastian','David','Vargas','Herrera',9,1),
(1001234508,'Valentina','Isabel','Castro','Mendoza',10,1),
(1001234509,'Felipe','Santiago','Herrera','Acosta',11,2),
(1001234510,'Natalia','Juliana','Reyes','Gomez',12,2);

-- ADMINISTRADOR
INSERT INTO administrador (id_user_data,estado,fecha_inicio,fecha_fin)
VALUES
(1,'Activo','2025-01-01',NULL),
(2,'Activo','2024-05-30',NULL);


-- PROPIETARIOS
INSERT INTO propietario (id_user_data,estado)
VALUES
(1,'Activo'),
(2,'Activo'),
(3,'Activo'),
(4,'Activo'),
(5,'Activo'),
(6,'Activo'),
(7,'Activo'),
(8,'Activo'),
(9,'Activo'),
(10,'Activo');
-- BLOQUES
INSERT INTO bloque (nombre)
VALUES
('A1'),('A2'),
('B1'),('B2'),
('C1'),('C2'),
('D1'),('D2'),
('E1'),('E2'),
('F1'),('F2'),
('G2'),('G2'),
('H1'),('H2'),
('I1'),('I2'),
('J1'),('J2'),
('K1'),('K2'),
('L1'),('L2'),
('M1'),('M2');

-- INTERIORES
INSERT INTO interior (numero,id_bloque)
VALUES
('1',1),('3',1),('5',1),
('1',2),('3',2),('5',2),
('1',3),('3',3),('5',3),
('1',4),('3',4),('5',4),
('1',5),('3',5),('5',5),
('1',6),('3',6),('5',6),
('1',7),('3',7),('5',7),
('1',8),('3',8),('5',8),
('1',9),('3',9),('5',9),
('1',10),('3',10),('5',10),
('1',11),('3',11),('5',11),
('1',12),('3',12),('5',12),
('1',13),('3',13),('5',13),
('1',14),('3',14),('5',14),
('1',15),('3',15),('5',15),
('1',16),('3',16),('5',16),
('1',17),('3',17),('5',17),
('1',18),('3',18),('5',18),
('1',19),('3',19),('5',19),
('1',20),('3',20),('5',20),
('1',21),('3',21),('5',21),
('1',22),('3',22),('5',22),
('1',23),('3',23),('5',23),
('1',24),('3',24),('5',24),
('1',25),('3',25),('5',25),
('1',26),('3',26),('5',26);

-- APARTAMENTOS
INSERT INTO apartamento (estado,numero,id_interior)
VALUES
('Activo','101',1),
('Activo','102',3),
('Activo','103',1),
('Activo','104',3),
('Activo','105',1),
('Activo','107',3),
('Activo','108',1),
('Activo','109',3),
('Activo','201',1),
('Activo','202',3),
('Activo','203',1),
('Activo','204',1),
('Activo','205',3),
('Activo','206',1),
('Activo','207',3),
('Activo','208',3),
('Activo','209',5),
('Activo','301',1),
('Activo','302',3),
('Activo','303',5),
('Activo','304',1),
('Activo','305',3),
('Activo','306',5),
('Activo','307',1),
('Activo','308',3),
('Activo','309',5),
('Activo','401',1),
('Activo','401',3),
('Activo','402',5),
('Activo','403',1),
('Activo','404',3),
('Activo','405',5),
('Activo','406',1);

-- PROPIETARIO GESTION APARTAMENTO
INSERT INTO propietario_gestion_apartamento
(id_propietario,id_apartamento,fecha_registro,estado)
VALUES
(1,1,'2025-01-15','Activo'),
(2,2,'2025-11-25','Activo'),
(1,3,'2024-06-3','Activo'),
(3,4,'2025-01-20','Activo'),
(4,5,'2025-01-15','Activo'),
(5,6,'2025-01-15','Activo'),
(6,7,'2025-01-15','Activo'),
(7,8,'2025-01-15','Activo'),
(8,9,'2025-01-15','Activo'),
(9,10,'2025-01-15','Activo'),
(10,1,'2025-01-15','Activo');

-- QUEJAS Y SUGERENCIAS
INSERT INTO queja_sugerencia
(id_propietario,id_administrador,descripcion_pqr,titulo_pqr,estado,fecha,evidencias)
VALUES
(1,1,'Ruido excesivo en las noches','Queja por ruido','Pendiente','2025-05-01 10:00:00','ruido.mp4'),
(2,1,'Solicitud de mantenimiento ascensor','Mantenimiento','Pendiente','2025-05-03 11:00:00','ascensor.jpg'),
(3,2,'Fugas de agua en el pasillo','Daño tubería','En proceso','2025-05-05 09:30:00','agua.png'),
(4,2,'Mal olor en las zonas comunes','Aseo','Pendiente','2025-05-06 14:20:00','olor.jpg'),
(5,1,'Problemas con el parqueadero','Parqueadero','Resuelta','2025-05-07 16:45:00','parqueadero.mp4');

-- PQR ESPECIFICA
INSERT INTO pqr_especifica (id_queja_sugerencia,id_apartamento)
VALUES
(1,1),
(2,2),
(1,3),
(2,4),
(3,5),
(4,6),
(5,7),
(3,8),
(4,9),
(5,10);
-- NOTICIAS
INSERT INTO noticia (descripcion,estado,fecha_publicacion,id_administrador)
VALUES
('Se realizará mantenimiento de zonas comunes el fin de semana','Activa','2025-05-10 08:00:00',1),
('Nueva reglamentación para uso del salón comunal','Activa','2025-05-12 09:00:00',1),
('Corte de agua programado para el martes','Activa','2025-05-14 07:00:00',1),
('Jornada de fumigación en el conjunto residencial','Activa','2025-05-16 10:00:00',1),
('Reunión general de propietarios el próximo sábado','Activa','2025-05-18 18:00:00',1);

-- SALON COMUNAL
INSERT INTO salon_comunal (estado)
VALUES
('Disponible');

-- ALQUILER
INSERT INTO alquiler
(id_propietario,id_salon_comunal,descripcion,hora_inicio,hora_fin,valor_hora,estado)
VALUES
(1,1,'Cumpleaños familiar','2025-06-10 14:00:00','2025-06-10 20:00:00',50000,'Reservado'),
(2,1,'Reunión empresarial','2025-06-12 08:00:00','2025-06-12 12:00:00',60000,'Reservado'),
(3,1,'Baby shower','2025-06-15 15:00:00','2025-06-15 19:00:00',55000,'Reservado'),
(4,NULL,'Fiesta infantil','2025-06-18 13:00:00','2025-06-18 18:00:00',50000,'Reservado'),
(5,NULL,'Capacitación comunitaria','2025-06-20 09:00:00','2025-06-20 17:00:00',70000,'Reservado');

-- SILLAS
INSERT INTO silla (cantidad,estado)
VALUES
(120,'Disponible');
-- ALQUILER SILLA
INSERT INTO alquiler_silla (id_alquiler,id_silla)
VALUES
(1,1),
(2,1),
(3,1),
(4,1),
(5,1);
-- TIPO MULTA
INSERT INTO tipo_multa (numero,descripcion,valor,estado)
VALUES
('A1','Ruido en horarios no permitidos',200000,'Activa'),
('A2','Mal manejo de basuras',100000,'Activa'),
('A3','Uso indebido de zonas comunes',150000,'Activa'),
('A4','Mascotas sin supervisión',120000,'Activa'),
('A5','Parqueo en zona prohibida',180000,'Activa'),
('A6','Daños a bienes comunes',300000,'Activa'),
('A7','Exceso de volumen en eventos',220000,'Activa');

-- MULTAS
INSERT INTO multa
(numero,nombre,descripcion,estado,id_tipo_multa,id_apartamento,id_administrador,evidencia)
VALUES
(1,'Multa por ruido','Se presentó ruido excesivo después de las 11 PM','Pendiente',1,1,1,'ruido_evidencia.jpg'),
(2,'Multa por basuras','Basuras dejadas en zonas comunes','Pendiente',2,2,1,'basuras.jpg'),
(3,'Multa por mascotas','Mascota sin correa en zonas comunes','Pendiente',3,4,1,'mascota.jpg'),
(4,'Multa por parqueo','Vehículo parqueado en zona prohibida','Pendiente',4,5,1,'parqueo.png'),
(5,'Multa por daños','Daños ocasionados al ascensor','En proceso',5,2,1,'ascensor_daño.mp4'),
(6,'Multa por ruido','Música con volumen elevado después de las 10 PM','Pendiente',6,3,1,'ruido_noche.jpg'),
(7,'Multa por basura','Desechos fuera del horario permitido','Resuelta',7,1,1,'basura_pasillo.png');
