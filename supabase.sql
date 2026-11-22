-- Cosas de la uni · configuración de Supabase (pégalo completo en SQL Editor y dale Run, una sola vez)
-- MODO PRUEBA: cualquiera con el link puede leer y escribir. Sirve para probar con tus amigos;
-- antes de abrirlo al público hay que pasar a cuentas reales (Supabase Auth) y reglas por usuario.

create sequence if not exists objetos_seq;

create table if not exists public.objetos (
  k        text primary key,          -- qué es: coleccion/id[/campo/elemento]
  col      text not null,             -- colección (posts, chats, usuarios…)
  datos    jsonb,                     -- el contenido
  borrado  boolean not null default false,
  seq      bigint not null default nextval('objetos_seq'),  -- orden de cambios, para bajar solo lo nuevo
  t        timestamptz not null default now()
);
create index if not exists objetos_seq_idx on public.objetos (seq);

create or replace function public.objetos_tocar() returns trigger language plpgsql as $$
begin
  new.seq := nextval('objetos_seq');
  new.t := now();
  return new;
end $$;
drop trigger if exists objetos_tocar on public.objetos;
create trigger objetos_tocar before insert or update on public.objetos for each row execute function public.objetos_tocar();

alter table public.objetos enable row level security;
drop policy if exists "prueba: leer" on public.objetos;
drop policy if exists "prueba: crear" on public.objetos;
drop policy if exists "prueba: cambiar" on public.objetos;
create policy "prueba: leer"    on public.objetos for select to anon, authenticated using (true);
create policy "prueba: crear"   on public.objetos for insert to anon, authenticated with check (true);
create policy "prueba: cambiar" on public.objetos for update to anon, authenticated using (true) with check (true);
grant select, insert, update on public.objetos to anon, authenticated;
grant usage, select on sequence objetos_seq to anon, authenticated;

-- Archivos (canciones, fotos y PDFs del tablón)
insert into storage.buckets (id, name, public) values ('archivos', 'archivos', true) on conflict (id) do nothing;
drop policy if exists "prueba: subir archivos" on storage.objects;
drop policy if exists "prueba: ver archivos" on storage.objects;
drop policy if exists "prueba: reemplazar archivos" on storage.objects;
create policy "prueba: subir archivos"      on storage.objects for insert to anon, authenticated with check (bucket_id = 'archivos');
create policy "prueba: ver archivos"        on storage.objects for select to anon, authenticated using (bucket_id = 'archivos');
create policy "prueba: reemplazar archivos" on storage.objects for update to anon, authenticated using (bucket_id = 'archivos') with check (bucket_id = 'archivos');
