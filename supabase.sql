
create sequence if not exists objetos_seq;

create table if not exists public.objetos (
  k        text primary key,
  col      text not null,
  datos    jsonb,
  borrado  boolean not null default false,
  seq      bigint not null default nextval('objetos_seq'),
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

insert into storage.buckets (id, name, public) values ('archivos', 'archivos', true) on conflict (id) do nothing;
drop policy if exists "prueba: subir archivos" on storage.objects;
drop policy if exists "prueba: ver archivos" on storage.objects;
drop policy if exists "prueba: reemplazar archivos" on storage.objects;
create policy "prueba: subir archivos"      on storage.objects for insert to anon, authenticated with check (bucket_id = 'archivos');
create policy "prueba: ver archivos"        on storage.objects for select to anon, authenticated using (bucket_id = 'archivos');
create policy "prueba: reemplazar archivos" on storage.objects for update to anon, authenticated using (bucket_id = 'archivos') with check (bucket_id = 'archivos');
