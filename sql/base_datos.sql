-- ============================================================
-- base_datos.sql → EcoJunín (MariaDB 10.11 / MySQL 8.0, InnoDB, utf8mb4)
-- Subconjunto del modelo del informe (cap. 7) que usa la web:
-- reportes ciudadanos, evidencia, historial, quiz y administrador.
-- Cambios respecto al informe: reporte_ambiental guarda nombres, apellidos y zona
-- (el formulario no exige cuenta) y pregunta tiene url_imagen (imagen opcional).
-- ============================================================
DROP DATABASE IF EXISTS ecojunin;
CREATE DATABASE ecojunin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecojunin;

CREATE TABLE municipalidad (
  id_municipalidad INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  ubigeo CHAR(6) NOT NULL,
  jurisdiccion_distrital VARCHAR(120) NOT NULL,
  CONSTRAINT pk_municipalidad PRIMARY KEY (id_municipalidad),
  CONSTRAINT uq_municipalidad_ubigeo UNIQUE (ubigeo)
) ENGINE=InnoDB;

CREATE TABLE usuario (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  nombre_completo VARCHAR(120) NOT NULL,
  correo_electronico VARCHAR(120) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol_usuario ENUM('CIUDADANO','PERSONAL_MUNICIPAL','ADMINISTRADOR') NOT NULL DEFAULT 'CIUDADANO',
  estado_cuenta ENUM('ACTIVA','DESACTIVADA') NOT NULL DEFAULT 'ACTIVA',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuario_correo UNIQUE (correo_electronico)
) ENGINE=InnoDB;

CREATE TABLE reporte_ambiental (
  id_reporte BIGINT NOT NULL AUTO_INCREMENT,            -- es el "ID" 1, 2, 3... del panel admin
  codigo_seguimiento VARCHAR(30) NOT NULL,
  id_usuario INT NULL,                                  -- NULL si reporta sin cuenta
  id_municipalidad INT NOT NULL DEFAULT 1,
  nombres VARCHAR(60) NOT NULL,
  apellidos VARCHAR(60) NOT NULL,
  zona VARCHAR(120) NOT NULL,
  categoria_foco ENUM('ACUMULACION_RESIDUOS','BOTADERO_INFORMAL','RESIDUOS_EN_RIO','QUEMA_RESIDUOS','OTRO') NOT NULL DEFAULT 'OTRO',
  descripcion VARCHAR(500) NOT NULL,
  latitud DECIMAL(9,6) NOT NULL,
  longitud DECIMAL(9,6) NOT NULL,
  estado_atencion ENUM('REGISTRADO','EN_EVALUACION','OBSERVADO','RECHAZADO','EN_ATENCION','FINALIZADO') NOT NULL DEFAULT 'REGISTRADO',
  fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,   -- fecha automática del día
  fecha_finalizacion DATETIME NULL,
  CONSTRAINT pk_reporte PRIMARY KEY (id_reporte),
  CONSTRAINT uq_reporte_codigo UNIQUE (codigo_seguimiento),
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_reporte_municipalidad FOREIGN KEY (id_municipalidad) REFERENCES municipalidad (id_municipalidad),
  CONSTRAINT ck_reporte_descripcion CHECK (CHAR_LENGTH(descripcion) BETWEEN 10 AND 500),
  CONSTRAINT ck_reporte_coordenadas CHECK (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180),
  CONSTRAINT ck_reporte_cierre CHECK ((estado_atencion = 'FINALIZADO') = (fecha_finalizacion IS NOT NULL))
) ENGINE=InnoDB;

CREATE TABLE evidencia_reporte (
  id_evidencia BIGINT NOT NULL AUTO_INCREMENT,
  id_reporte BIGINT NOT NULL,
  url_foto VARCHAR(255) NOT NULL,                       -- solo la URL; el archivo va fuera de la BD
  tipo_evidencia ENUM('INICIAL','ATENCION') NOT NULL DEFAULT 'INICIAL',
  fecha_carga DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_evidencia PRIMARY KEY (id_evidencia),
  CONSTRAINT fk_evidencia_reporte FOREIGN KEY (id_reporte) REFERENCES reporte_ambiental (id_reporte) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE historial_estado (
  id_historial BIGINT NOT NULL AUTO_INCREMENT,
  id_reporte BIGINT NOT NULL,
  id_usuario INT NULL,
  estado_nuevo ENUM('REGISTRADO','EN_EVALUACION','OBSERVADO','RECHAZADO','EN_ATENCION','FINALIZADO') NOT NULL,
  observacion VARCHAR(300) NULL,
  fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_historial PRIMARY KEY (id_historial),
  CONSTRAINT fk_historial_reporte FOREIGN KEY (id_reporte) REFERENCES reporte_ambiental (id_reporte),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE quiz (
  id_quiz INT NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(150) NOT NULL,
  puntaje_minimo TINYINT NOT NULL DEFAULT 11,
  estado_publicacion ENUM('BORRADOR','PUBLICADO','DESPUBLICADO') NOT NULL DEFAULT 'BORRADOR',
  CONSTRAINT pk_quiz PRIMARY KEY (id_quiz),
  CONSTRAINT ck_quiz_puntaje CHECK (puntaje_minimo BETWEEN 0 AND 20)
) ENGINE=InnoDB;

CREATE TABLE pregunta (
  id_pregunta INT NOT NULL AUTO_INCREMENT,
  id_quiz INT NOT NULL,
  enunciado VARCHAR(300) NOT NULL,
  url_imagen VARCHAR(255) NULL,
  retroalimentacion VARCHAR(300) NULL,                  -- "por qué es la correcta"
  CONSTRAINT pk_pregunta PRIMARY KEY (id_pregunta),
  CONSTRAINT fk_pregunta_quiz FOREIGN KEY (id_quiz) REFERENCES quiz (id_quiz) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE opcion_respuesta (
  id_opcion INT NOT NULL AUTO_INCREMENT,
  id_pregunta INT NOT NULL,
  texto_opcion VARCHAR(200) NOT NULL,
  es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT pk_opcion PRIMARY KEY (id_opcion),
  CONSTRAINT fk_opcion_pregunta FOREIGN KEY (id_pregunta) REFERENCES pregunta (id_pregunta) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE intento_quiz (
  id_intento BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_quiz INT NOT NULL,
  aciertos TINYINT NOT NULL,
  puntaje DECIMAL(4,2) NOT NULL,
  aprobado BOOLEAN NOT NULL,
  fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_intento PRIMARY KEY (id_intento),
  CONSTRAINT fk_intento_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_intento_quiz FOREIGN KEY (id_quiz) REFERENCES quiz (id_quiz),
  CONSTRAINT ck_intento_puntaje CHECK (puntaje BETWEEN 0 AND 20 AND aciertos >= 0)
) ENGINE=InnoDB;

-- Índices secundarios para las consultas del panel
CREATE INDEX ix_reporte_estado_fecha ON reporte_ambiental (estado_atencion, fecha_envio);
CREATE INDEX ix_pregunta_quiz ON pregunta (id_quiz);
CREATE INDEX ix_opcion_pregunta ON opcion_respuesta (id_pregunta);

-- ---------- Vistas: lo que muestra el panel de administrador ----------
CREATE VIEW v_resumen_reportes AS
SELECT COUNT(*) AS recibidos,
       COALESCE(SUM(estado_atencion = 'FINALIZADO'), 0) AS atendidos,
       COALESCE(SUM(estado_atencion <> 'FINALIZADO'), 0) AS por_atender
FROM reporte_ambiental;

CREATE VIEW v_reportes_admin AS
SELECT id_reporte AS id, CONCAT(nombres, ' ', apellidos) AS nombres_completos,
       IF(estado_atencion = 'FINALIZADO', 'Solucionado', 'Pendiente') AS estado,
       fecha_envio, zona, descripcion, latitud, longitud
FROM reporte_ambiental ORDER BY id_reporte;

CREATE VIEW v_detalle_quiz AS
SELECT p.id_pregunta, p.enunciado, o.texto_opcion AS respuesta_correcta, p.retroalimentacion
FROM pregunta p JOIN opcion_respuesta o ON o.id_pregunta = p.id_pregunta AND o.es_correcta = TRUE;

CREATE VIEW v_ranking_quiz AS                       -- ranking por jerarquía: mejor intento de cada usuario
SELECT RANK() OVER (ORDER BY MAX(i.puntaje) DESC) AS puesto, u.nombre_completo, MAX(i.puntaje) AS mejor_puntaje, COUNT(*) AS intentos
FROM intento_quiz i JOIN usuario u ON u.id_usuario = i.id_usuario
GROUP BY u.id_usuario, u.nombre_completo;

-- Crear cuenta = INSERT INTO usuario (nombre_completo, correo_electronico, contrasena_hash) VALUES (...)  (rol CIUDADANO por defecto)
-- Iniciar sesión = SELECT id_usuario, nombre_completo, contrasena_hash FROM usuario WHERE correo_electronico = ? AND estado_cuenta = 'ACTIVA'

-- ---------- Procedimientos almacenados ----------
DELIMITER //
CREATE PROCEDURE sp_registrar_reporte(IN p_nombres VARCHAR(60), IN p_apellidos VARCHAR(60), IN p_zona VARCHAR(120),
  IN p_descripcion VARCHAR(500), IN p_lat DECIMAL(9,6), IN p_lng DECIMAL(9,6), IN p_url_foto VARCHAR(255))
BEGIN
  DECLARE v_id BIGINT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  INSERT INTO reporte_ambiental (codigo_seguimiento, nombres, apellidos, zona, descripcion, latitud, longitud)
  VALUES (CONCAT('REP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0')),
          p_nombres, p_apellidos, p_zona, p_descripcion, p_lat, p_lng);
  SET v_id = LAST_INSERT_ID();
  INSERT INTO evidencia_reporte (id_reporte, url_foto) VALUES (v_id, p_url_foto);
  INSERT INTO historial_estado (id_reporte, estado_nuevo, observacion) VALUES (v_id, 'REGISTRADO', 'Reporte enviado');
  COMMIT;
  SELECT v_id AS id_reporte;
END //

CREATE PROCEDURE sp_resolver_reporte(IN p_id BIGINT, IN p_admin INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  UPDATE reporte_ambiental SET estado_atencion = 'FINALIZADO', fecha_finalizacion = NOW() WHERE id_reporte = p_id;
  INSERT INTO historial_estado (id_reporte, id_usuario, estado_nuevo, observacion) VALUES (p_id, p_admin, 'FINALIZADO', 'Marcado como solucionado');
  COMMIT;
END //
DELIMITER ;

-- ---------- Datos iniciales ----------
INSERT INTO municipalidad (nombre, ubigeo, jurisdiccion_distrital) VALUES ('Municipalidad Distrital de Chilca', '120114', 'Chilca');
-- La contraseña NUNCA se guarda en texto: genera el hash Argon2id desde el servidor y reemplaza el valor.
INSERT INTO usuario (nombre_completo, correo_electronico, contrasena_hash, rol_usuario)
VALUES ('Administrador EcoJunín', 'admin', 'REEMPLAZAR_POR_HASH_ARGON2ID', 'ADMINISTRADOR');
INSERT INTO quiz (titulo, puntaje_minimo, estado_publicacion) VALUES ('Quiz ambiental EcoJunín', 11, 'PUBLICADO');

-- Banco inicial de preguntas (generado desde js/datos.js)
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (1, 1, '¿Qué porcentaje de los residuos municipales de la región Junín se dispuso de forma adecuada en 2020?', NULL, 'Según el MINAM, Junín generó cerca de 271 mil toneladas de residuos municipales al año y solo el 12,5 % tuvo una disposición adecuada.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (1, '12,5 %', TRUE),
  (1, '45 %', FALSE),
  (1, '70 %', FALSE),
  (1, '95 %', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (2, 1, 'Los botaderos «El Edén» y «Agua de las Vírgenes» están a orillas de un río de Junín. ¿Cuál?', NULL, 'El OEFA denunció la inadecuada disposición de residuos en esos botaderos, ubicados a orillas del río Mantaro.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (2, 'Río Mantaro', TRUE),
  (2, 'Río Chanchamayo', FALSE),
  (2, 'Río Perené', FALSE),
  (2, 'Río Tulumayo', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (3, 1, '¿Qué ODS está relacionado con la acción contra el cambio climático?', NULL, 'El ODS 13, «Acción por el Clima», promueve medidas urgentes contra el cambio climático y la educación ambiental.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (3, 'ODS 1', FALSE),
  (3, 'ODS 7', FALSE),
  (3, 'ODS 13', TRUE),
  (3, 'ODS 16', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (4, 1, '¿Qué entidad es responsable de la gestión de los residuos sólidos dentro de su jurisdicción?', NULL, 'Las municipalidades gestionan los residuos sólidos de su distrito o provincia; por eso los reportes llegan a ellas.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (4, 'Las municipalidades', TRUE),
  (4, 'Los colegios', FALSE),
  (4, 'Las empresas de transporte', FALSE),
  (4, 'Los mercados', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (5, 1, '¿Qué significan las 3R del reciclaje?', NULL, 'Reducir el consumo, reutilizar lo que se pueda y reciclar el resto disminuye la cantidad de residuos que llega a los botaderos.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (5, 'Reducir, reutilizar, reciclar', TRUE),
  (5, 'Recoger, reunir, repartir', FALSE),
  (5, 'Reparar, renovar, regalar', FALSE),
  (5, 'Rechazar, reemplazar, resumir', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (6, 1, '¿Qué ocurre cuando se queman residuos a cielo abierto?', NULL, 'La quema libera humo y gases tóxicos que dañan la salud y contaminan el aire; es una de las categorías de reporte.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (6, 'Se liberan gases y humo contaminantes', TRUE),
  (6, 'Se purifica el aire', FALSE),
  (6, 'Se genera abono', FALSE),
  (6, 'No pasa nada', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (7, 1, '¿Para qué sirve el compostaje?', NULL, 'El compostaje transforma restos de frutas, verduras y hojas en abono natural, y reduce los residuos orgánicos.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (7, 'Convertir restos orgánicos en abono', TRUE),
  (7, 'Derretir plásticos', FALSE),
  (7, 'Fabricar vidrio', FALSE),
  (7, 'Limpiar ríos', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (8, 1, '¿Cuál es el principal gas de efecto invernadero emitido por las actividades humanas?', NULL, 'El CO₂, producido sobre todo al quemar combustibles, es el principal responsable del calentamiento global.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (8, 'Dióxido de carbono (CO₂)', TRUE),
  (8, 'Oxígeno', FALSE),
  (8, 'Nitrógeno', FALSE),
  (8, 'Helio', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (9, 1, '¿Cómo afecta un botadero informal cercano a un río?', NULL, 'Los residuos y sus líquidos llegan al cauce y empeoran la calidad del agua; la ANA identificó botaderos como fuente de contaminación en la cuenca del Mantaro.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (9, 'Contamina el agua y daña a la fauna', TRUE),
  (9, 'Mejora la calidad del agua', FALSE),
  (9, 'No tiene efectos', FALSE),
  (9, 'Aumenta los peces', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (10, 1, 'Si ves un foco de basura en tu barrio, ¿qué es lo más útil para ayudar a resolverlo?', NULL, 'Un reporte con foto, ubicación y descripción permite que la municipalidad lo identifique y le dé seguimiento.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (10, 'Reportarlo con foto y ubicación', TRUE),
  (10, 'Quemarlo', FALSE),
  (10, 'Taparlo con tierra', FALSE),
  (10, 'Ignorarlo', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (11, 1, 'El botadero El Porvenir (El Tambo) tendría una capacidad remanente de aproximadamente…', NULL, 'El OEFA alertó que su capacidad remanente era de unos dos meses, lo que muestra la urgencia de una mejor gestión de residuos.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (11, 'Dos meses', TRUE),
  (11, 'Diez años', FALSE),
  (11, 'Cincuenta años', FALSE),
  (11, 'Un día', FALSE);
INSERT INTO pregunta (id_pregunta, id_quiz, enunciado, url_imagen, retroalimentacion) VALUES (12, 1, '¿Qué recomendó el OEFA desde 2011 para Huancayo?', NULL, 'El OEFA recomendó construir una planta de tratamiento de residuos, porque los botaderos no son una solución definitiva.');
INSERT INTO opcion_respuesta (id_pregunta, texto_opcion, es_correcta) VALUES
  (12, 'Construir una planta de tratamiento de residuos', TRUE),
  (12, 'Cerrar todos los mercados', FALSE),
  (12, 'Prohibir el reciclaje', FALSE),
  (12, 'Importar basura', FALSE);
