CREATE TABLE noticia(
 id INT PRIMARY KEY AUTO_INCREMENT,
 descripcion VARCHAR(10000) NOT NULL,
 estado VARCHAR(20) NOT NULL,
 fecha_publicacion TIMESTAMP NOT NULL,
 id_administrador INT NOT NULL,
 archivo_url VARCHAR(500) NULL,

 FOREIGN KEY (id_administrador)
 REFERENCES administrador(id)
 ON DELETE RESTRICT
 ON UPDATE CASCADE
 );