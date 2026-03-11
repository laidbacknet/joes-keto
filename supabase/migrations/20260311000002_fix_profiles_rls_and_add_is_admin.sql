begin;

-- Drop the recursive profiles admin policies that query public.profiles
-- from within a public.profiles policy (causing infinite recursion: 42P17)
drop policy if exists "profiles_admin_select_all" on public.profiles;
drop policy if exists "profiles_admin_update_all" on public.profiles;
drop policy if exists "profiles_admin_delete_all" on public.profiles;

-- Also drop the recursive admin policies on other tables so they can be
-- replaced with the cleaner is_admin() helper below
drop policy if exists "recipes_admin_select_all" on public.recipes;
drop policy if exists "recipes_admin_update_all" on public.recipes;
drop policy if exists "recipes_admin_delete_all" on public.recipes;

drop policy if exists "meal_plans_admin_select_all" on public.meal_plans;
drop policy if exists "meal_plans_admin_update_all" on public.meal_plans;
drop policy if exists "meal_plans_admin_delete_all" on public.meal_plans;

drop policy if exists "meal_entries_admin_select_all" on public.meal_entries;
drop policy if exists "meal_entries_admin_update_all" on public.meal_entries;
drop policy if exists "meal_entries_admin_delete_all" on public.meal_entries;

-- Create a security-definer helper function that safely determines whether
-- the current authenticated user has role = 'admin'.
--
-- Using SECURITY DEFINER means the function runs with the permissions of its
-- owner (postgres) and bypasses RLS on public.profiles, which avoids the
-- infinite recursion that would occur if a profiles policy called a function
-- that itself queried profiles under RLS.
create or replace function public.is_admin()
returns boolean
language sql
volatile
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Restrict function execution to authenticated users only
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Recreate safe profiles admin policies using the is_admin() helper
create policy "profiles_admin_select_all"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "profiles_admin_update_all"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "profiles_admin_delete_all"
on public.profiles
for delete
to authenticated
using (public.is_admin());

-- Recreate admin policies on recipes using is_admin() for consistency
create policy "recipes_admin_select_all"
on public.recipes
for select
to authenticated
using (public.is_admin());

create policy "recipes_admin_update_all"
on public.recipes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "recipes_admin_delete_all"
on public.recipes
for delete
to authenticated
using (public.is_admin());

-- Recreate admin policies on meal_plans using is_admin()
create policy "meal_plans_admin_select_all"
on public.meal_plans
for select
to authenticated
using (public.is_admin());

create policy "meal_plans_admin_update_all"
on public.meal_plans
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "meal_plans_admin_delete_all"
on public.meal_plans
for delete
to authenticated
using (public.is_admin());

-- Recreate admin policies on meal_entries using is_admin()
create policy "meal_entries_admin_select_all"
on public.meal_entries
for select
to authenticated
using (public.is_admin());

create policy "meal_entries_admin_update_all"
on public.meal_entries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "meal_entries_admin_delete_all"
on public.meal_entries
for delete
to authenticated
using (public.is_admin());

commit;
