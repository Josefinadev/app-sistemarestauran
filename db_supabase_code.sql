-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agregado (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_grupo uuid NOT NULL,
  nombre character varying NOT NULL,
  precio numeric NOT NULL DEFAULT 0 CHECK (precio >= 0::numeric),
  disponible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agregado_pkey PRIMARY KEY (id),
  CONSTRAINT agregado_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupo_agregados(id)
);
CREATE TABLE public.categoria (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  imagen_url text,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categoria_pkey PRIMARY KEY (id),
  CONSTRAINT categoria_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.detalle_pedido (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_pedido uuid NOT NULL,
  id_producto uuid NOT NULL,
  precio_unitario numeric NOT NULL,
  notas text,
  estado USER-DEFINED NOT NULL DEFAULT 'PENDIENTE'::estado_pedido,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id),
  CONSTRAINT detalle_pedido_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id),
  CONSTRAINT detalle_pedido_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id)
);
CREATE TABLE public.detalle_pedido_agregado (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_detalle_pedido uuid NOT NULL,
  id_agregado uuid NOT NULL,
  precio_momento numeric NOT NULL,
  CONSTRAINT detalle_pedido_agregado_pkey PRIMARY KEY (id),
  CONSTRAINT detalle_pedido_agregado_id_detalle_pedido_fkey FOREIGN KEY (id_detalle_pedido) REFERENCES public.detalle_pedido(id),
  CONSTRAINT detalle_pedido_agregado_id_agregado_fkey FOREIGN KEY (id_agregado) REFERENCES public.agregado(id)
);
CREATE TABLE public.grupo_agregados (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  nombre character varying NOT NULL,
  min_seleccion integer NOT NULL DEFAULT 0,
  max_seleccion integer NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grupo_agregados_pkey PRIMARY KEY (id),
  CONSTRAINT grupo_agregados_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.mesa (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  numero integer NOT NULL,
  slug character varying NOT NULL DEFAULT (uuid_generate_v4())::text UNIQUE,
  capacidad integer NOT NULL DEFAULT 4,
  activa boolean NOT NULL DEFAULT true,
  qr_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mesa_pkey PRIMARY KEY (id),
  CONSTRAINT mesa_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.pedido (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  id_mesa uuid NOT NULL,
  id_usuario uuid,
  numero_pedido integer NOT NULL DEFAULT nextval('pedido_numero_pedido_seq'::regclass),
  estado USER-DEFINED NOT NULL DEFAULT 'PENDIENTE'::estado_pedido,
  estado_pago USER-DEFINED NOT NULL DEFAULT 'PENDIENTE'::estado_pago,
  metodo_pago USER-DEFINED,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notas text,
  comprobante_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  pagado_en timestamp with time zone,
  deleted_at timestamp with time zone,
  CONSTRAINT pedido_pkey PRIMARY KEY (id),
  CONSTRAINT pedido_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id),
  CONSTRAINT pedido_id_mesa_fkey FOREIGN KEY (id_mesa) REFERENCES public.mesa(id),
  CONSTRAINT pedido_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id)
);
CREATE TABLE public.producto (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  id_categoria uuid NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  precio numeric NOT NULL CHECK (precio >= 0::numeric),
  imagen_url text,
  disponible boolean NOT NULL DEFAULT true,
  stock integer NOT NULL DEFAULT 0,
  es_bebida boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  requiere_preparacion boolean DEFAULT true,
  CONSTRAINT producto_pkey PRIMARY KEY (id),
  CONSTRAINT producto_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id),
  CONSTRAINT producto_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categoria(id)
);
CREATE TABLE public.producto_grupo (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_producto uuid NOT NULL,
  id_grupo uuid NOT NULL,
  CONSTRAINT producto_grupo_pkey PRIMARY KEY (id),
  CONSTRAINT producto_grupo_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id),
  CONSTRAINT producto_grupo_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupo_agregados(id)
);
CREATE TABLE public.promocion (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  titulo character varying NOT NULL,
  descripcion text,
  imagen_url text,
  descuento_porcentaje numeric CHECK (descuento_porcentaje >= 0::numeric AND descuento_porcentaje <= 100::numeric),
  descuento_fijo numeric CHECK (descuento_fijo >= 0::numeric),
  fecha_inicio timestamp with time zone NOT NULL,
  fecha_fin timestamp with time zone NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promocion_pkey PRIMARY KEY (id),
  CONSTRAINT promocion_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.restaurante (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  logo_url text,
  direccion text,
  telefono character varying,
  latitud double precision NOT NULL DEFAULT '-8.1116'::numeric,
  longitud double precision NOT NULL DEFAULT '-79.0290'::numeric,
  radio_permitido_metros integer NOT NULL DEFAULT 50,
  moneda character varying NOT NULL DEFAULT 'PEN'::character varying,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT restaurante_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuario (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  email character varying,
  nombre character varying NOT NULL,
  rol USER-DEFINED NOT NULL DEFAULT 'cliente'::rol_usuario,
  avatar_url text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  auth_id uuid UNIQUE,
  CONSTRAINT usuario_pkey PRIMARY KEY (id),
  CONSTRAINT usuario_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.web_combo (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  precio numeric NOT NULL,
  precio_original numeric,
  incluye ARRAY,
  imagen_url text,
  popular boolean DEFAULT false,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT web_combo_pkey PRIMARY KEY (id),
  CONSTRAINT web_combo_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.web_config (
  id_restaurante uuid NOT NULL,
  whatsapp character varying,
  telefono character varying,
  direccion text,
  horario_semana character varying,
  horario_finde character varying,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT web_config_pkey PRIMARY KEY (id_restaurante),
  CONSTRAINT web_config_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);
CREATE TABLE public.web_oferta (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_restaurante uuid NOT NULL,
  titulo character varying NOT NULL,
  descripcion text,
  descuento character varying,
  imagen_url text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT web_oferta_pkey PRIMARY KEY (id),
  CONSTRAINT web_oferta_id_restaurante_fkey FOREIGN KEY (id_restaurante) REFERENCES public.restaurante(id)
);