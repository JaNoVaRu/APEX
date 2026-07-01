-- Libro Mayor — esquema inicial para Supabase (Postgres)
-- Corre esto en el SQL editor de tu proyecto de Supabase.
-- auth.users ya existe (lo crea Supabase Auth); esta tabla lo extiende 1 a 1.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  is_owner boolean not null default false,
  plan text not null default 'free' check (plan in ('free','premium')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Se crea automáticamente un profile cuando alguien se registra
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Catálogo de contenido (equivalente a DEFAULT_CATALOG en el HTML actual)
create table public.subjects (
  id text primary key,
  code text not null,
  division text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.topics (
  id text primary key,
  subject_id text not null references public.subjects(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete cascade,
  label text not null
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete cascade,
  question text not null,
  options jsonb not null,       -- ["opción A", "opción B", "opción C", "opción D"]
  correct_index int not null
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  title text not null,
  published_on date not null default current_date
);

-- Datos de cada usuario
create table public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  was_correct boolean not null,
  attempted_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text,
  status text not null default 'inactive',   -- active | canceled | past_due | inactive
  current_period_end timestamptz
);

-- ============ Row Level Security ============
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.subscriptions enable row level security;

-- Cada quien lee y edita solo su propio perfil
create policy "profiles: leer el propio" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: editar el propio" on public.profiles
  for update using (auth.uid() = id);

-- Cada quien lee y edita solo su propio avance
create policy "progress: leer el propio" on public.user_progress
  for select using (auth.uid() = user_id);
create policy "progress: insertar el propio" on public.user_progress
  for insert with check (auth.uid() = user_id);
create policy "progress: borrar el propio" on public.user_progress
  for delete using (auth.uid() = user_id);

-- Cada quien lee y registra sus propios intentos de práctica
create policy "attempts: leer los propios" on public.quiz_attempts
  for select using (auth.uid() = user_id);
create policy "attempts: insertar los propios" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- Cada quien lee su propia suscripción (la escritura la hace el webhook con la service key, no el usuario)
create policy "subscriptions: leer la propia" on public.subscriptions
  for select using (auth.uid() = user_id);

-- El catálogo (subjects, topics, resources, news) es de lectura pública.
-- quiz_questions es la excepción: se queda con RLS activado y SIN política de
-- select, a propósito, porque esta tabla base contiene correct_index. Nadie
-- (ni siquiera un usuario autenticado) puede leerla directamente. Lo que se
-- expone al cliente es la vista quiz_questions_public (ver abajo), que no
-- incluye correct_index. La validación de "¿acertaste?" se hace más adelante
-- en una Edge Function con la service key, no en el cliente.
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.resources enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.news enable row level security;

create policy "catalogo: lectura publica" on public.subjects for select using (true);
create policy "catalogo: lectura publica" on public.topics for select using (true);
create policy "catalogo: lectura publica" on public.resources for select using (true);
create policy "catalogo: lectura publica" on public.news for select using (true);

-- Vista pública de preguntas de práctica: expone todo excepto correct_index.
-- Al no declarar `security_invoker`, la vista corre con los privilegios de su
-- dueño (el rol que la crea, con permisos de superusuario en Supabase), lo
-- que le permite leer quiz_questions pese a que esa tabla no tiene política
-- de select para anon/authenticated. Así el filtrado de la respuesta correcta
-- queda garantizado a nivel de base de datos, no solo por convención en el
-- frontend.
create view public.quiz_questions_public as
  select id, subject_id, question, options
  from public.quiz_questions;

grant select on public.quiz_questions_public to anon, authenticated;

-- Nota: para producción, la escritura sobre subjects/topics/quiz_questions/news debería
-- restringirse a un rol de administrador (por ejemplo, profiles.is_owner = true), no
-- quedar abierta. Agrega esa política antes de dar acceso de administración a nadie más.

-- ============ Restringir qué columnas de profiles puede tocar el usuario ============
-- La política "profiles: editar el propio" solo filtra FILAS (auth.uid() = id), no
-- COLUMNAS: sin este REVOKE/GRANT, cualquier usuario autenticado podría hacer
-- `update profiles set is_owner = true` (o plan = 'premium') sobre su propia fila
-- y auto-promoverse. Solo "name" debe ser editable por el usuario; is_owner, plan
-- y stripe_customer_id los escribe el backend (webhook de Stripe / función de
-- servidor con la service key), nunca el cliente.
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;
