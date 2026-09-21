-- Im Supabase SQL Editor ausführen. Browser erhalten keinen direkten Tabellenzugriff.
create table if not exists public.app_state(id integer primary key check(id=1),revision bigint not null default 0,state jsonb not null);
create table if not exists public.auth_rates(key text primary key,started timestamptz not null,hits integer not null);
alter table public.app_state enable row level security;
alter table public.auth_rates enable row level security;
revoke all on public.app_state, public.auth_rates from anon,authenticated;
grant all on public.app_state, public.auth_rates to service_role;
create or replace function public.commit_state(expected bigint,next_state jsonb) returns boolean language plpgsql security invoker set search_path=public as $$
begin
 update app_state set state=next_state,revision=revision+1 where id=1 and revision=expected;
 return found;
end $$;
create or replace function public.check_rate(bucket text,maximum integer) returns boolean language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 delete from auth_rates where started<now()-interval '1 day';
 insert into auth_rates(key,started,hits) values(bucket,now(),1)
 on conflict(key) do update set hits=case when auth_rates.started<now()-interval '15 minutes' then 1 else auth_rates.hits+1 end,started=case when auth_rates.started<now()-interval '15 minutes' then now() else auth_rates.started end returning hits into n;
 return n<=maximum;
end $$;
revoke all on function public.commit_state(bigint,jsonb),public.check_rate(text,integer) from public,anon,authenticated;
grant execute on function public.commit_state(bigint,jsonb),public.check_rate(text,integer) to service_role;
