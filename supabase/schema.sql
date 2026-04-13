-- Versión corregida y lista para el SQL Editor de Supabase
-- Se han añadido 'IF NOT EXISTS' y se ha corregido el tipo 'ARRAY' por 'uuid[]'

CREATE TABLE IF NOT EXISTS public.permisos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  descripcion text,
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT permisos_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid NOT NULL PRIMARY KEY,
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  nombre_completo character varying,
  direccion text,
  telefono character varying,
  permisos_globales uuid[] DEFAULT '{}'::uuid[],
  fecha_nacimiento date,
  estado boolean DEFAULT true,
  creado_en timestamp with time zone DEFAULT now()
);

-- FUNCIÓN DE SINCRONIZACIÓN (Auth -> Public)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, username, nombre_completo)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DISPARADOR (Trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.grupos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  descripcion text,
  creador_id uuid NOT NULL,
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT grupos_pkey PRIMARY KEY (id),
  CONSTRAINT grupos_creador_id_fkey FOREIGN KEY (creador_id) REFERENCES public.usuarios(id)
);

CREATE TABLE IF NOT EXISTS public.grupo_miembros (
  grupo_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  fecha_unido timestamp with time zone DEFAULT now(),
  CONSTRAINT grupo_miembros_pkey PRIMARY KEY (grupo_id, usuario_id),
  CONSTRAINT grupo_miembros_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id),
  CONSTRAINT grupo_miembros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

CREATE TABLE IF NOT EXISTS public.estados (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  color character varying,
  CONSTRAINT estados_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.prioridades (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  CONSTRAINT prioridades_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  grupo_id uuid NOT NULL,
  titulo character varying NOT NULL,
  descripcion text,
  autor_id uuid NOT NULL,
  asignado_id uuid,
  estado_id uuid NOT NULL,
  priority_id uuid NOT NULL,
  creado_en timestamp with time zone DEFAULT now(),
  fecha_final timestamp with time zone,
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id),
  CONSTRAINT tickets_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.usuarios(id),
  CONSTRAINT tickets_asignado_id_fkey FOREIGN KEY (asignado_id) REFERENCES public.usuarios(id),
  CONSTRAINT tickets_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.estados(id),
  CONSTRAINT tickets_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.prioridades(id)
);

CREATE TABLE IF NOT EXISTS public.comentarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  autor_id uuid NOT NULL,
  contenido text NOT NULL,
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT comentarios_pkey PRIMARY KEY (id),
  CONSTRAINT comentarios_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id),
  CONSTRAINT comentarios_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.usuarios(id)
);

CREATE TABLE IF NOT EXISTS public.historial_tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  usuario_id uuid,
  accion character varying NOT NULL,
  detalles jsonb,
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT historial_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT historial_tickets_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id),
  CONSTRAINT historial_tickets_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- FUNCIÓN DE AUDITORÍA DE TICKETS
CREATE OR REPLACE FUNCTION public.handle_ticket_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.historial_tickets (ticket_id, usuario_id, accion, detalles)
    VALUES (
      NEW.id, 
      COALESCE(NEW.asignado_id, NEW.autor_id), 
      'Actualización', 
      jsonb_build_object(
        'estado_anterior', (SELECT nombre FROM public.estados WHERE id = OLD.estado_id),
        'estado_nuevo', (SELECT nombre FROM public.estados WHERE id = NEW.estado_id),
        'titulo', NEW.titulo
      )
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.historial_tickets (ticket_id, usuario_id, accion, detalles)
    VALUES (NEW.id, NEW.autor_id, 'Creación', jsonb_build_object('titulo', NEW.titulo));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER DE AUDITORÍA
DROP TRIGGER IF EXISTS on_ticket_change ON public.tickets;
CREATE TRIGGER on_ticket_change
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_ticket_audit();

CREATE TABLE IF NOT EXISTS public.grupo_usuario_permisos (
  grupo_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  permiso_id uuid NOT NULL,
  CONSTRAINT grupo_usuario_permisos_pkey PRIMARY KEY (grupo_id, usuario_id, permiso_id),
  CONSTRAINT grupo_usuario_permisos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id),
  CONSTRAINT grupo_usuario_permisos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT grupo_usuario_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id)
);
