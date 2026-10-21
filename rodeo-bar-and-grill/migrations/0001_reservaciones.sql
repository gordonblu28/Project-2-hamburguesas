-- Reservaciones en línea (Cloudflare D1). Aplicar:
--   npx wrangler@4 d1 migrations apply rodeo-reservaciones --remote
-- Nunca se guardan datos de tarjeta: el pago ocurre en Stripe y aquí solo queda su referencia.

CREATE TABLE IF NOT EXISTS reservaciones (
  id TEXT PRIMARY KEY,                 -- identificador aleatorio (UUID); también es la clave del enlace de confirmación
  codigo TEXT NOT NULL UNIQUE,         -- código corto para el cliente y el personal, ej. RDO-7K3PQX
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  fecha TEXT NOT NULL,                 -- AAAA-MM-DD, hora local del restaurante
  hora TEXT NOT NULL,                  -- HH:MM (24 h)
  inicio_min INTEGER NOT NULL,         -- minutos desde la medianoche: para calcular traslapes
  fin_min INTEGER NOT NULL,
  personas INTEGER NOT NULL,
  peticiones TEXT,
  total_centavos INTEGER NOT NULL,     -- total de la reserva
  deposito_centavos INTEGER NOT NULL,  -- lo que se cobra en línea
  moneda TEXT NOT NULL,
  -- pendiente_pago | procesando_pago | confirmada | sentada | completada | no_llego
  -- | cancelada | vencida | pago_fallido | revision
  estado TEXT NOT NULL,
  -- sin_pagar | procesando | pagado | fallido
  estado_pago TEXT NOT NULL,
  stripe_sesion TEXT UNIQUE,
  stripe_pago TEXT,                    -- PaymentIntent de Stripe (para reembolsos desde el panel de Stripe)
  apartada_hasta INTEGER,              -- epoch ms: hasta cuándo se aparta el lugar mientras se paga
  creada INTEGER NOT NULL,
  actualizada INTEGER NOT NULL,
  confirmada INTEGER
);

CREATE INDEX IF NOT EXISTS idx_reservaciones_fecha ON reservaciones (fecha, estado);

-- Eventos de Stripe ya procesados: el mismo aviso puede llegar dos veces.
CREATE TABLE IF NOT EXISTS eventos_stripe (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  recibido INTEGER NOT NULL
);
