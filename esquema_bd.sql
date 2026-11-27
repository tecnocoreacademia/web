-- ============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - TECNOCORE LMS & WEB (POSTGRESQL)
-- Arquitectura: Autenticación y gestión 100% propia (sin Supabase Auth)
-- Orden de ejecución respetando dependencias de claves foráneas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. FUNCIÓN REUTILIZABLE DE AUDITORÍA TEMPORAL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 1. TABLA: USUARIOS (Base estilo CloudMeet + control de estado y Telegram)
-- ----------------------------------------------------------------------------
CREATE TABLE public.usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'alumno'
        CHECK (rol IN ('alumno', 'profesor', 'admin')),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobado', 'denegado', 'bloqueado')),
    notificado_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_estado ON public.usuarios(estado);
CREATE INDEX idx_usuarios_pendientes_telegram ON public.usuarios(notificado_telegram)
    WHERE notificado_telegram = FALSE;


-- ----------------------------------------------------------------------------
-- 2. TABLA: CURSOS (Catálogo, escaparate comercial y motor de evaluación)
-- ----------------------------------------------------------------------------
CREATE TABLE public.cursos (
    id SERIAL PRIMARY KEY,
    profesor_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,

    -- Identidad y escaparate
    codigo_curso VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    subtitulo VARCHAR(250),
    slug VARCHAR(150) UNIQUE NOT NULL,
    descripcion_corta VARCHAR(300),
    descripcion_larga TEXT,
    imagen_portada_url TEXT,
    video_trailer_url TEXT,

    -- Clasificación y detalles académicos
    categoria VARCHAR(50) NOT NULL DEFAULT 'Sistemas y Linux',
    nivel VARCHAR(20) NOT NULL DEFAULT 'desde_cero'
        CHECK (nivel IN ('desde_cero', 'basico', 'intermedio', 'avanzado')),
    requisitos_previos TEXT DEFAULT 'Ninguno. Empezamos desde cero paso a paso.',
    entorno_practico VARCHAR(150),
    que_aprenderas TEXT[] DEFAULT '{}',
    etiquetas TEXT[] DEFAULT '{}',

    -- Estructura y carga lectiva
    duracion_estimada_horas INTEGER NOT NULL DEFAULT 0 CHECK (duracion_estimada_horas >= 0),
    total_bloques INTEGER NOT NULL DEFAULT 1 CHECK (total_bloques >= 1),
    total_temas INTEGER NOT NULL DEFAULT 0 CHECK (total_temas >= 0),
    total_ejercicios INTEGER NOT NULL DEFAULT 0 CHECK (total_ejercicios >= 0),

    -- Reglas de evaluación (siempre suman 100%)
    peso_ejercicios NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    peso_examenes_bloque NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    peso_proyecto_final NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    nota_minima_aprobado NUMERIC(4,2) NOT NULL DEFAULT 5.00 CHECK (nota_minima_aprobado BETWEEN 0 AND 10),
    emite_certificado BOOLEAN NOT NULL DEFAULT TRUE,

    -- Modelo comercial y control de acceso
    tipo_acceso VARCHAR(25) NOT NULL DEFAULT 'pago_unico'
        CHECK (tipo_acceso IN ('gratis', 'pago_unico', 'suscripcion', 'privado_invitacion')),
    precio NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (precio >= 0),
    precio_oferta NUMERIC(8,2) CHECK (precio_oferta IS NULL OR precio_oferta >= 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'EUR',
    plazas_maximas INTEGER CHECK (plazas_maximas IS NULL OR plazas_maximas > 0),
    acceso_dias INTEGER CHECK (acceso_dias IS NULL OR acceso_dias > 0),

    -- Visibilidad y orden en la web
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'proximamente', 'publicado', 'archivado')),
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    orden_catalogo INTEGER NOT NULL DEFAULT 0,

    -- Auditoría temporal
    fecha_lanzamiento TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_pesos_evaluacion_100
        CHECK (peso_ejercicios + peso_examenes_bloque + peso_proyecto_final = 100.00)
);

CREATE INDEX idx_cursos_estado_orden ON public.cursos(estado, orden_catalogo);
CREATE INDEX idx_cursos_categoria ON public.cursos(categoria);
CREATE INDEX idx_cursos_etiquetas ON public.cursos USING GIN(etiquetas);

CREATE TRIGGER trg_cursos_actualizacion
    BEFORE UPDATE ON public.cursos
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();


-- ----------------------------------------------------------------------------
-- 3. TABLA: LECCIONES (Estructura estilo Moodle por bloques y recursos)
-- ----------------------------------------------------------------------------
CREATE TABLE public.lecciones (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,

    -- Estructura estilo Moodle (Bloques + Orden)
    bloque_numero INTEGER NOT NULL DEFAULT 1 CHECK (bloque_numero >= 1),
    bloque_titulo VARCHAR(150) NOT NULL DEFAULT 'Bloque 1',
    orden_leccion INTEGER NOT NULL DEFAULT 1 CHECK (orden_leccion >= 1),
    tipo_item VARCHAR(25) NOT NULL DEFAULT 'leccion'
        CHECK (tipo_item IN ('leccion', 'practica_guiada', 'examen_bloque', 'proyecto_final')),
    codigo_tema VARCHAR(20),

    -- Identidad y contenido principal
    titulo VARCHAR(180) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    resumen_corto VARCHAR(300),
    contenido_teoria TEXT,

    -- Multimedia y documentos del profesor
    video_url TEXT,
    duracion_minutos INTEGER NOT NULL DEFAULT 0 CHECK (duracion_minutos >= 0),
    pdf_apuntes_url TEXT,
    presentacion_url TEXT,

    -- Actividad / Boletín práctico
    tiene_actividad BOOLEAN NOT NULL DEFAULT FALSE,
    titulo_actividad VARCHAR(180),
    instrucciones_actividad TEXT,
    pdf_boletin_url TEXT,
    solucionario_url TEXT,
    mostrar_solucionario BOOLEAN NOT NULL DEFAULT FALSE,
    nota_maxima_actividad NUMERIC(4,2) NOT NULL DEFAULT 10.00 CHECK (nota_maxima_actividad > 0),

    -- Adjuntos extra ilimitados (PDFs, scripts .sh, enlaces, plantillas...)
    recursos_extra JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Control de acceso y visibilidad tipo Moodle
    es_gratis_preview BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_anterior BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'oculto'
        CHECK (estado IN ('oculto', 'publicado', 'programado')),
    fecha_publicacion TIMESTAMPTZ,

    -- Auditoría temporal
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lecciones_curso_slug UNIQUE (curso_id, slug),
    CONSTRAINT uq_lecciones_curso_posicion UNIQUE (curso_id, bloque_numero, orden_leccion)
);

CREATE INDEX idx_lecciones_curso_orden ON public.lecciones(curso_id, bloque_numero, orden_leccion);
CREATE INDEX idx_lecciones_estado ON public.lecciones(curso_id, estado);

CREATE TRIGGER trg_lecciones_actualizacion
    BEFORE UPDATE ON public.lecciones
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();


-- ----------------------------------------------------------------------------
-- 4. TABLA: MATRÍCULAS (Inscripciones, notas ponderadas y control de diplomas)
-- ----------------------------------------------------------------------------
CREATE TABLE public.matriculas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    curso_id INTEGER NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,

    -- Estado de inscripción y gestión económica
    estado_matricula VARCHAR(25) NOT NULL DEFAULT 'pendiente_pago'
        CHECK (estado_matricula IN ('pendiente_pago', 'activa', 'completada', 'expirada', 'cancelada')),
    metodo_pago VARCHAR(40),
    importe_pagado NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (importe_pagado >= 0),
    notas_profesor TEXT,

    -- Seguimiento global y notas ponderadas del curso
    porcentaje_progreso NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (porcentaje_progreso BETWEEN 0 AND 100),
    nota_ejercicios NUMERIC(4,2) CHECK (nota_ejercicios IS NULL OR nota_ejercicios BETWEEN 0 AND 10),
    nota_examenes NUMERIC(4,2) CHECK (nota_examenes IS NULL OR nota_examenes BETWEEN 0 AND 10),
    nota_proyecto NUMERIC(4,2) CHECK (nota_proyecto IS NULL OR nota_proyecto BETWEEN 0 AND 10),
    nota_final NUMERIC(4,2) CHECK (nota_final IS NULL OR nota_final BETWEEN 0 AND 10),
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,

    -- Control de diplomas (generación, descarga y envío manual por el profesor)
    diploma_generado BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_diploma VARCHAR(40) UNIQUE,
    diploma_pdf_url TEXT,
    diploma_emitido_por INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha_emision_diploma TIMESTAMPTZ,
    diploma_enviado_email BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_envio_email_diploma TIMESTAMPTZ,

    -- Fechas clave
    fecha_matricula TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ,
    fecha_completado TIMESTAMPTZ,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_matriculas_usuario_curso UNIQUE (usuario_id, curso_id)
);

CREATE INDEX idx_matriculas_usuario ON public.matriculas(usuario_id, estado_matricula);
CREATE INDEX idx_matriculas_curso ON public.matriculas(curso_id, estado_matricula);
CREATE INDEX idx_matriculas_diplomas_pendientes ON public.matriculas(curso_id, aprobado, diploma_generado);

CREATE TRIGGER trg_matriculas_actualizacion
    BEFORE UPDATE ON public.matriculas
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();


-- ----------------------------------------------------------------------------
-- 5. TABLA: PROGRESO (Avance tema a tema y cuaderno privado del alumno)
-- ----------------------------------------------------------------------------
CREATE TABLE public.progreso (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    leccion_id INTEGER NOT NULL REFERENCES public.lecciones(id) ON DELETE CASCADE,

    -- Estado estilo Moodle
    estado_leccion VARCHAR(20) NOT NULL DEFAULT 'no_iniciada'
        CHECK (estado_leccion IN ('no_iniciada', 'en_curso', 'completada')),

    -- Checkpoints de material consumido
    apuntes_descargados BOOLEAN NOT NULL DEFAULT FALSE,
    video_visto BOOLEAN NOT NULL DEFAULT FALSE,

    -- Cuaderno privado del alumno en ese tema
    notas_personales_alumno TEXT,

    -- Seguimiento de actividad y tiempos
    tiempo_dedicado_minutos INTEGER NOT NULL DEFAULT 0 CHECK (tiempo_dedicado_minutos >= 0),
    fecha_inicio TIMESTAMPTZ,
    fecha_completado TIMESTAMPTZ,
    ultima_visita TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_progreso_usuario_leccion UNIQUE (usuario_id, leccion_id)
);

CREATE INDEX idx_progreso_usuario_estado ON public.progreso(usuario_id, estado_leccion);
CREATE INDEX idx_progreso_leccion ON public.progreso(leccion_id);

CREATE TRIGGER trg_progreso_actualizacion
    BEFORE UPDATE ON public.progreso
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();


-- ----------------------------------------------------------------------------
-- 6. TABLA: ENTREGAS_EJERCICIOS (Boletines prácticos, reintentos y corrección)
-- ----------------------------------------------------------------------------
CREATE TABLE public.entregas_ejercicios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    leccion_id INTEGER NOT NULL REFERENCES public.lecciones(id) ON DELETE CASCADE,

    -- Control de reintentos
    numero_intento INTEGER NOT NULL DEFAULT 1 CHECK (numero_intento >= 1),

    -- Entrega del alumno (fichero o código pegado)
    archivo_url TEXT,
    nombre_archivo VARCHAR(255),
    contenido_codigo TEXT,
    comentario_alumno TEXT,

    -- Corrección y evaluación del profesor
    estado_entrega VARCHAR(25) NOT NULL DEFAULT 'entregado'
        CHECK (estado_entrega IN ('entregado', 'en_revision', 'corregido', 'requiere_correccion')),
    nota NUMERIC(4,2) CHECK (nota IS NULL OR nota BETWEEN 0 AND 10),
    feedback_profesor TEXT,
    corregido_por INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,

    -- Aviso para el bot de Telegram
    notificado_telegram BOOLEAN NOT NULL DEFAULT FALSE,

    -- Fechas clave
    fecha_entrega TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_correccion TIMESTAMPTZ,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_entrega_usuario_leccion_intento UNIQUE (usuario_id, leccion_id, numero_intento),
    CONSTRAINT chk_entrega_con_contenido CHECK (archivo_url IS NOT NULL OR contenido_codigo IS NOT NULL)
);

CREATE INDEX idx_entregas_usuario_leccion ON public.entregas_ejercicios(usuario_id, leccion_id);
CREATE INDEX idx_entregas_pendientes_corregir ON public.entregas_ejercicios(estado_entrega, fecha_entrega)
    WHERE estado_entrega IN ('entregado', 'en_revision');
CREATE INDEX idx_entregas_telegram ON public.entregas_ejercicios(notificado_telegram)
    WHERE notificado_telegram = FALSE;

CREATE TRIGGER trg_entregas_actualizacion
    BEFORE UPDATE ON public.entregas_ejercicios
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();


-- ----------------------------------------------------------------------------
-- 7. TABLA: RESULTADOS_EXAMENES (Exámenes por bloque y proyecto final)
-- ----------------------------------------------------------------------------
CREATE TABLE public.resultados_examenes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    curso_id INTEGER NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    leccion_id INTEGER NOT NULL REFERENCES public.lecciones(id) ON DELETE CASCADE,

    -- Tipo de prueba e intento
    tipo_evaluacion VARCHAR(25) NOT NULL DEFAULT 'examen_bloque'
        CHECK (tipo_evaluacion IN ('examen_bloque', 'proyecto_final', 'recuperacion')),
    numero_intento INTEGER NOT NULL DEFAULT 1 CHECK (numero_intento >= 1),

    -- Contenido entregado (test autocorregible JSON o archivo del proyecto final)
    respuestas_json JSONB,
    archivo_proyecto_url TEXT,
    nombre_archivo VARCHAR(255),
    comentario_alumno TEXT,

    -- Calificación y revisión
    estado_evaluacion VARCHAR(25) NOT NULL DEFAULT 'pendiente_revision'
        CHECK (estado_evaluacion IN ('pendiente_revision', 'calificado', 'anulado')),
    nota NUMERIC(4,2) CHECK (nota IS NULL OR nota BETWEEN 0 AND 10),
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    feedback_profesor TEXT,
    corregido_por INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,

    -- Aviso para el bot de Telegram
    notificado_telegram BOOLEAN NOT NULL DEFAULT FALSE,

    -- Fechas clave
    fecha_realizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_correccion TIMESTAMPTZ,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_resultado_usuario_leccion_intento UNIQUE (usuario_id, leccion_id, numero_intento)
);

CREATE INDEX idx_resultados_usuario_curso ON public.resultados_examenes(usuario_id, curso_id);
CREATE INDEX idx_resultados_pendientes ON public.resultados_examenes(estado_evaluacion, fecha_realizacion)
    WHERE estado_evaluacion = 'pendiente_revision';
CREATE INDEX idx_resultados_telegram ON public.resultados_examenes(notificado_telegram)
    WHERE notificado_telegram = FALSE;

CREATE TRIGGER trg_resultados_actualizacion
    BEFORE UPDATE ON public.resultados_examenes
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();


-- ----------------------------------------------------------------------------
-- 8. TABLA: LEADS_WEB (CRM unificado de clases particulares y recursos gratis)
-- ----------------------------------------------------------------------------
CREATE TABLE public.leads_web (
    id SERIAL PRIMARY KEY,
    tipo_solicitud VARCHAR(30) NOT NULL DEFAULT 'clases_particulares'
        CHECK (tipo_solicitud IN ('clases_particulares', 'recurso_gratuito', 'consulta_general')),

    -- Datos de contacto del interesado
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefono VARCHAR(25),

    -- Detalles si pide clases particulares
    nivel_estudios VARCHAR(80),
    asignatura_o_tema VARCHAR(150),
    modalidad VARCHAR(25) DEFAULT 'online'
        CHECK (modalidad IN ('online', 'presencial', 'indiferente')),

    -- Detalles si descarga un recurso gratuito
    recurso_solicitado VARCHAR(150),

    -- Mensaje y gestión comercial
    mensaje TEXT,
    estado_seguimiento VARCHAR(25) NOT NULL DEFAULT 'nuevo'
        CHECK (estado_seguimiento IN ('nuevo', 'contactado', 'en_proceso', 'convertido', 'descartado')),
    notas_admin TEXT,

    -- Vinculación si el lead termina creando cuenta en la plataforma
    usuario_convertido_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,

    -- Aviso para el bot de Telegram
    notificado_telegram BOOLEAN NOT NULL DEFAULT FALSE,

    -- Fechas clave
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_tipo_estado ON public.leads_web(tipo_solicitud, estado_seguimiento, fecha_solicitud DESC);
CREATE INDEX idx_leads_email ON public.leads_web(email);
CREATE INDEX idx_leads_telegram ON public.leads_web(notificado_telegram)
    WHERE notificado_telegram = FALSE;

CREATE TRIGGER trg_leads_actualizacion
    BEFORE UPDATE ON public.leads_web
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_modificacion();