-- Verificación rigurosa de creadores: proceso KYC de 8 pasos
-- (documento oficial, DOB comprobada, selfie, comparación facial,
--  consentimiento explícito, auditoría, foto sosteniendo documento,
--  revisión manual)

-- Helper RLS: ¿el usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$;

-- ── Tabla de verificaciones ────────────────────────────────────────────
create table if not exists public.creator_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'in_review', 'approved', 'denied')),
  document_type text,
  declared_dob date,
  verified_dob date,
  document_url text,
  selfie_url text,
  holding_document_url text,
  consent_biometric_at timestamptz,
  consent_data_at timestamptz,
  consent_ip text,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  denial_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Solo una solicitud activa (draft/submitted/in_review) por usuario
create unique index if not exists creator_verifications_one_active_user
  on public.creator_verifications (user_id)
  where status in ('draft', 'submitted', 'in_review');

create index if not exists idx_creator_verifications_status
  on public.creator_verifications (status);

-- ── Auditoría de la verificación ──────────────────────────────────────
create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.creator_verifications(id) on delete cascade,
  event text not null,
  metadata jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_verification_events_verification_id
  on public.verification_events (verification_id);

-- ── Columnas en profiles ──────────────────────────────────────────────
alter table public.profiles add column if not exists verification_status text;
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_dob date;

-- ── RLS: creator_verifications ────────────────────────────────────────
alter table public.creator_verifications enable row level security;

create policy "Users can create their own verification"
  on public.creator_verifications for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own verification"
  on public.creator_verifications for select
  using (auth.uid() = user_id or public.is_admin());

-- El usuario solo edita solicitudes en draft/denied y no puede falsear
-- los campos de revisión del admin.
create policy "Users can update their own verification"
  on public.creator_verifications for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status in ('draft', 'denied')
    and reviewed_by is null
    and reviewed_at is null
    and verified_dob is null
  );

-- ── RLS: verification_events ──────────────────────────────────────────
alter table public.verification_events enable row level security;

create policy "Users can log their own verification events"
  on public.verification_events for insert
  with check (auth.uid() = actor_id);

create policy "Users can view events of their verifications"
  on public.verification_events for select
  using (
    exists (
      select 1 from public.creator_verifications cv
      where cv.id = verification_id
        and (cv.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── Storage: bucket privado ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('creator-verification', 'creator-verification', false)
on conflict (id) do nothing;

create policy "Users can upload their own verification files"
  on storage.objects for insert
  with check (
    bucket_id = 'creator-verification'
    and owner_id::text = auth.uid()::text
  );

create policy "Users and admins can view verification files"
  on storage.objects for select
  using (
    bucket_id = 'creator-verification'
    and (owner_id::text = auth.uid()::text or public.is_admin())
  );

-- El wizard re-subida con upsert:true, y el archivo ya existe → UPDATE.
-- Sin esta política el re-subido falla con "new row violates RLS".
create policy "Users can update their own verification files"
  on storage.objects for update
  using (
    bucket_id = 'creator-verification'
    and owner_id::text = auth.uid()::text
  )
  with check (
    bucket_id = 'creator-verification'
    and owner_id::text = auth.uid()::text
  );

create policy "Admins can delete verification files"
  on storage.objects for delete
  using (
    bucket_id = 'creator-verification'
    and (owner_id::text = auth.uid()::text or public.is_admin())
  );
