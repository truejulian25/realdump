-- Botón de donación: enlace de PayPal del creador
-- Almacena la URL de PayPal (paypal.me/...) que alimenta el botón "Donar"
-- del perfil público del creador.

alter table public.profiles add column if not exists paypal_url text;
