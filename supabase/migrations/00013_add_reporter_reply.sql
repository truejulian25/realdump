-- Respuesta del reportero al pedido de más información + timestamp de actualización
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_reply TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
