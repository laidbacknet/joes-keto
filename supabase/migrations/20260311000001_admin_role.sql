begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add admin / approval fields to profiles
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role       text        not null default 'user',
  add column if not exists approved   boolean     not null default false,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid        references public.profiles(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Security-definer helper functions
-- (run as the function owner / postgres, so they bypass RLS and avoid
--  infinite recursion when called from within RLS policies)
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns true when the current session user has role = 'admin'
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Returns true when the current session user is approved or is an admin
create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (approved = true or role = 'admin')
  )
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  –  update existing policies to include admin access
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- recipes  –  require approval for normal users; admins bypass
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "recipes_select_own" on public.recipes;
create policy "recipes_select_own"
  on public.recipes for select to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own"
  on public.recipes for insert to authenticated
  with check (auth.uid() = user_id and public.is_approved());

drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own"
  on public.recipes for update to authenticated
  using  ((auth.uid() = user_id and public.is_approved()) or public.is_admin())
  with check ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own"
  on public.recipes for delete to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- meal_plans
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
  on public.meal_plans for select to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
  on public.meal_plans for insert to authenticated
  with check (auth.uid() = user_id and public.is_approved());

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
  on public.meal_plans for update to authenticated
  using  ((auth.uid() = user_id and public.is_approved()) or public.is_admin())
  with check ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "meal_plans_delete_own" on public.meal_plans;
create policy "meal_plans_delete_own"
  on public.meal_plans for delete to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- meal_entries
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "meal_entries_select_own" on public.meal_entries;
create policy "meal_entries_select_own"
  on public.meal_entries for select to authenticated
  using (
    (
      exists (
        select 1 from public.meal_plans mp
        where mp.id = meal_entries.meal_plan_id
          and mp.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  );

drop policy if exists "meal_entries_insert_own" on public.meal_entries;
create policy "meal_entries_insert_own"
  on public.meal_entries for insert to authenticated
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_entries.meal_plan_id
        and mp.user_id = auth.uid()
    )
    and public.is_approved()
  );

drop policy if exists "meal_entries_update_own" on public.meal_entries;
create policy "meal_entries_update_own"
  on public.meal_entries for update to authenticated
  using (
    (
      exists (
        select 1 from public.meal_plans mp
        where mp.id = meal_entries.meal_plan_id
          and mp.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  )
  with check (
    (
      exists (
        select 1 from public.meal_plans mp
        where mp.id = meal_entries.meal_plan_id
          and mp.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  );

drop policy if exists "meal_entries_delete_own" on public.meal_entries;
create policy "meal_entries_delete_own"
  on public.meal_entries for delete to authenticated
  using (
    (
      exists (
        select 1 from public.meal_plans mp
        where mp.id = meal_entries.meal_plan_id
          and mp.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- meals
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "meals_select_own" on public.meals;
create policy "meals_select_own"
  on public.meals for select to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own"
  on public.meals for insert to authenticated
  with check (auth.uid() = user_id and public.is_approved());

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own"
  on public.meals for update to authenticated
  using  ((auth.uid() = user_id and public.is_approved()) or public.is_admin())
  with check ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own"
  on public.meals for delete to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- meal_ingredients
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "meal_ingredients_select_own" on public.meal_ingredients;
create policy "meal_ingredients_select_own"
  on public.meal_ingredients for select to authenticated
  using (
    (
      exists (
        select 1 from public.meals m
        where m.id = meal_ingredients.meal_id
          and m.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  );

drop policy if exists "meal_ingredients_insert_own" on public.meal_ingredients;
create policy "meal_ingredients_insert_own"
  on public.meal_ingredients for insert to authenticated
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_ingredients.meal_id
        and m.user_id = auth.uid()
    )
    and public.is_approved()
  );

drop policy if exists "meal_ingredients_update_own" on public.meal_ingredients;
create policy "meal_ingredients_update_own"
  on public.meal_ingredients for update to authenticated
  using (
    (
      exists (
        select 1 from public.meals m
        where m.id = meal_ingredients.meal_id
          and m.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  );

drop policy if exists "meal_ingredients_delete_own" on public.meal_ingredients;
create policy "meal_ingredients_delete_own"
  on public.meal_ingredients for delete to authenticated
  using (
    (
      exists (
        select 1 from public.meals m
        where m.id = meal_ingredients.meal_id
          and m.user_id = auth.uid()
      )
      and public.is_approved()
    )
    or public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- planned_meals
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "planned_meals_select_own" on public.planned_meals;
create policy "planned_meals_select_own"
  on public.planned_meals for select to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "planned_meals_insert_own" on public.planned_meals;
create policy "planned_meals_insert_own"
  on public.planned_meals for insert to authenticated
  with check (auth.uid() = user_id and public.is_approved());

drop policy if exists "planned_meals_update_own" on public.planned_meals;
create policy "planned_meals_update_own"
  on public.planned_meals for update to authenticated
  using  ((auth.uid() = user_id and public.is_approved()) or public.is_admin())
  with check ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

drop policy if exists "planned_meals_delete_own" on public.planned_meals;
create policy "planned_meals_delete_own"
  on public.planned_meals for delete to authenticated
  using ((auth.uid() = user_id and public.is_approved()) or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Promote first admin  (run manually – replace the email address)
-- ─────────────────────────────────────────────────────────────────────────────
-- update public.profiles
-- set role     = 'admin',
--     approved = true
-- where email = 'admin@example.com';

commit;
