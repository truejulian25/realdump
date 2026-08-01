-- Declaración de titularidad, autorización y consentimiento sobre el contenido
-- Añade el timestamp del momento en que el usuario acepta la declaración de
-- contenido junto con el consentimiento explícito del paso 5 del wizard.

alter table public.creator_verifications add column if not exists content_declaration_at timestamptz;
