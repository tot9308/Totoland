-- ============================================================================
-- TOTOLAND - Esquema completo de base de datos
-- Ejecutar en Supabase SQL Editor para crear una instancia nueva
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- 2. TABLAS
-- ============================================================================

-- Casas (hogares compartidos)
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summer_start_month integer not null default 5,
  summer_end_month integer not null default 9,
  recovery_schedule text not null default 'B',
  reminder_time text not null default '08:00',
  invite_code text unique,
  created_at timestamptz not null default now()
);

-- Miembros de cada casa
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Perfiles de usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Plantas
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  species text,
  location text,
  watering_frequency_days numeric,
  watering_frequency_winter_days numeric,
  last_watered_at timestamptz,
  status text not null default 'alive',
  misting_enabled boolean not null default false,
  notes text,
  main_photo_path text,
  care_tips text,
  acquired_at date,
  died_at date,
  pot_diameter_cm integer,
  has_saucer boolean not null default false,
  recovery_check_at timestamptz,
  recovery_step integer not null default 0,
  recovery_severity text,
  recovery_started_at timestamptz,
  plant_type text,
  created_at timestamptz not null default now()
);

-- Eventos de cuidado (riegos, podas, observaciones, etc.)
create table if not exists public.care_events (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  occurred_at timestamptz not null default now(),
  notes text,
  batch_id uuid,
  detail text,
  health text,
  created_at timestamptz not null default now()
);

-- Fotos
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Suscripciones push (para notificaciones)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

-- Tareas mensuales (automáticas y personalizadas)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plant_id uuid references public.plants(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  month integer not null,
  year integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Logros desbloqueados
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  unique (household_id, user_id, code)
);

-- Recordatorios pospuestos (de notificaciones)
create table if not exists public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  plant_id uuid references public.plants(id) on delete cascade,
  title text not null,
  body text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Recordatorios personalizados (recurrentes)
create table if not exists public.custom_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plant_id uuid references public.plants(id) on delete cascade,
  title text not null,
  recurrence text not null default 'once',
  next_run_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================

create index if not exists idx_plants_household on public.plants(household_id);
create index if not exists idx_plants_status on public.plants(status);
create index if not exists idx_care_events_plant on public.care_events(plant_id);
create index if not exists idx_care_events_occurred on public.care_events(occurred_at);
create index if not exists idx_photos_plant on public.photos(plant_id);
create index if not exists idx_tasks_household_month on public.tasks(household_id, month, year);
create index if not exists idx_scheduled_notifications_pending on public.scheduled_notifications(status, scheduled_at);
create index if not exists idx_custom_reminders_active on public.custom_reminders(active, next_run_at);

-- ============================================================================
-- 4. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Generar código de invitación automáticamente
create or replace function public.set_invite_code()
returns trigger language plpgsql as $$
begin
  if new.invite_code is null then
    new.invite_code := upper(substr(md5(random()::text), 1, 6));
  end if;
  return new;
end; $$;

drop trigger if exists trg_invite_code on public.households;
create trigger trg_invite_code before insert on public.households
for each row execute function public.set_invite_code();

-- Generar códigos para casas existentes sin código
update public.households
set invite_code = upper(substr(md5(random()::text), 1, 6))
where invite_code is null;

-- Buscar casa por código (función segura)
create or replace function public.find_household_by_code(code text)
returns uuid language sql security definer stable as $$
  select id from public.households
  where upper(invite_code) = upper(trim(code))
  limit 1;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles enable row level security;
alter table public.plants enable row level security;
alter table public.care_events enable row level security;
alter table public.photos enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.tasks enable row level security;
alter table public.achievements enable row level security;
alter table public.scheduled_notifications enable row level security;
alter table public.custom_reminders enable row level security;

-- ============================================================================
-- POLÍTICAS DE HOUSEHOLDS
-- ============================================================================

drop policy if exists households_select on public.households;
create policy households_select on public.households
for select to authenticated using (
  id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists households_insert_own on public.households;
create policy households_insert_own on public.households
for insert to authenticated with check (true);

drop policy if exists households_update_own on public.households;
create policy households_update_own on public.households
for update to authenticated using (
  id in (select household_id from public.household_members where user_id = auth.uid())
);

-- ============================================================================
-- POLÍTICAS DE HOUSEHOLD_MEMBERS
-- ============================================================================

drop policy if exists members_select on public.household_members;
create policy members_select on public.household_members
for select to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists members_insert_own on public.household_members;
create policy members_insert_own on public.household_members
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists members_delete_own on public.household_members;
create policy members_delete_own on public.household_members
for delete to authenticated using (user_id = auth.uid());

-- ============================================================================
-- POLÍTICAS DE PROFILES
-- ============================================================================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated using (
  id = auth.uid() or id in (
    select m2.user_id from public.household_members m1
    join public.household_members m2 on m1.household_id = m2.household_id
    where m1.user_id = auth.uid()
  )
);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid());

-- ============================================================================
-- POLÍTICAS DE PLANTS
-- ============================================================================

drop policy if exists plants_select on public.plants;
create policy plants_select on public.plants
for select to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists plants_insert on public.plants;
create policy plants_insert on public.plants
for insert to authenticated with check (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists plants_update on public.plants;
create policy plants_update on public.plants
for update to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists plants_delete on public.plants;
create policy plants_delete on public.plants
for delete to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

-- ============================================================================
-- POLÍTICAS DE CARE_EVENTS
-- ============================================================================

drop policy if exists events_select on public.care_events;
create policy events_select on public.care_events
for select to authenticated using (
  plant_id in (
    select id from public.plants
    where household_id in (select household_id from public.household_members where user_id = auth.uid())
  )
);

drop policy if exists events_insert on public.care_events;
create policy events_insert on public.care_events
for insert to authenticated with check (
  plant_id in (
    select id from public.plants
    where household_id in (select household_id from public.household_members where user_id = auth.uid())
  )
);

drop policy if exists events_delete on public.care_events;
create policy events_delete on public.care_events
for delete to authenticated using (
  plant_id in (
    select id from public.plants
    where household_id in (select household_id from public.household_members where user_id = auth.uid())
  )
);

-- ============================================================================
-- POLÍTICAS DE PHOTOS
-- ============================================================================

drop policy if exists photos_select on public.photos;
create policy photos_select on public.photos
for select to authenticated using (
  plant_id in (
    select id from public.plants
    where household_id in (select household_id from public.household_members where user_id = auth.uid())
  )
);

drop policy if exists photos_insert on public.photos;
create policy photos_insert on public.photos
for insert to authenticated with check (
  plant_id in (
    select id from public.plants
    where household_id in (select household_id from public.household_members where user_id = auth.uid())
  )
);

drop policy if exists photos_delete on public.photos;
create policy photos_delete on public.photos
for delete to authenticated using (
  plant_id in (
    select id from public.plants
    where household_id in (select household_id from public.household_members where user_id = auth.uid())
  )
);

-- ============================================================================
-- POLÍTICAS DE PUSH_SUBSCRIPTIONS
-- ============================================================================

drop policy if exists push_select on public.push_subscriptions;
create policy push_select on public.push_subscriptions
for select to authenticated using (user_id = auth.uid());

drop policy if exists push_insert on public.push_subscriptions;
create policy push_insert on public.push_subscriptions
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists push_delete on public.push_subscriptions;
create policy push_delete on public.push_subscriptions
for delete to authenticated using (user_id = auth.uid());

-- ============================================================================
-- POLÍTICAS DE TASKS
-- ============================================================================

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
for select to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
for insert to authenticated with check (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
for update to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
for delete to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

-- ============================================================================
-- POLÍTICAS DE ACHIEVEMENTS
-- ============================================================================

drop policy if exists ach_select on public.achievements;
create policy ach_select on public.achievements
for select to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists ach_insert on public.achievements;
create policy ach_insert on public.achievements
for insert to authenticated with check (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

-- ============================================================================
-- POLÍTICAS DE SCHEDULED_NOTIFICATIONS
-- ============================================================================

drop policy if exists sched_select on public.scheduled_notifications;
create policy sched_select on public.scheduled_notifications
for select to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists sched_insert on public.scheduled_notifications;
create policy sched_insert on public.scheduled_notifications
for insert to authenticated with check (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists sched_update on public.scheduled_notifications;
create policy sched_update on public.scheduled_notifications
for update to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

-- ============================================================================
-- POLÍTICAS DE CUSTOM_REMINDERS
-- ============================================================================

drop policy if exists cr_select on public.custom_reminders;
create policy cr_select on public.custom_reminders
for select to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists cr_insert on public.custom_reminders;
create policy cr_insert on public.custom_reminders
for insert to authenticated with check (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists cr_update on public.custom_reminders;
create policy cr_update on public.custom_reminders
for update to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

drop policy if exists cr_delete on public.custom_reminders;
create policy cr_delete on public.custom_reminders
for delete to authenticated using (
  household_id in (select household_id from public.household_members where user_id = auth.uid())
);

-- ============================================================================
-- 6. STORAGE (ejecutar manualmente en Supabase Dashboard)
-- ============================================================================

-- Crear bucket "plant-photos" en Storage → New bucket
-- Nombre: plant-photos
-- Público: NO (usaremos URLs firmadas)

-- Políticas de Storage (ejecutar en SQL Editor):
-- (Estas políticas permiten que los miembros de una casa suban y lean fotos de sus plantas)

-- Nota: Las políticas de Storage se configuran en Supabase Dashboard → Storage → Policies
-- o mediante SQL con:
-- insert into storage.policies (name, definition, check_expression, action)
-- Pero es más fácil hacerlo desde la UI de Supabase

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
-- Para desplegar Totoland:
-- 1. Ejecutar este schema.sql en Supabase SQL Editor
-- 2. Crear bucket "plant-photos" en Storage (privado)
-- 3. Configurar variables de entorno en Vercel
-- 4. Desplegar el código
-- ============================================================================