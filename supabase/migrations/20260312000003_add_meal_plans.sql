begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Drop legacy tables (the init_schema created a different meal_plans schema
-- referencing profiles; meal_entries depends on it via FK).
-- CASCADE removes all dependent triggers, policies, and indexes automatically.
-- ─────────────────────────────────────────────────────────────────────────────
drop table if exists public.meal_entries cascade;
drop table if exists public.meal_plans cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- meal_plans  (user-owned weekly plan container)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.meal_plans (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null default 'My Meal Plan',
  week_start  date        null,
  status      text        not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_meal_plans_user_id on public.meal_plans(user_id);

create trigger set_meal_plans_updated_at
  before update on public.meal_plans
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- meal_plan_items  (individual meal assignments within a plan)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.meal_plan_items (
  id            uuid          primary key default gen_random_uuid(),
  meal_plan_id  uuid          not null references public.meal_plans(id) on delete cascade,
  meal_id       uuid          not null references public.meals(id) on delete cascade,
  day_of_week   int           not null check (day_of_week between 0 and 6),
  meal_slot     text          not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  servings      numeric(10,2) not null default 1,
  sort_order    int           not null default 0,
  created_at    timestamptz   not null default now()
);

create index idx_meal_plan_items_meal_plan_id on public.meal_plan_items(meal_plan_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

-- meal_plans: users own their rows
alter table public.meal_plans enable row level security;

create policy "meal_plans_select_own"
  on public.meal_plans for select to authenticated
  using (auth.uid() = user_id);

create policy "meal_plans_insert_own"
  on public.meal_plans for insert to authenticated
  with check (auth.uid() = user_id);

create policy "meal_plans_update_own"
  on public.meal_plans for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meal_plans_delete_own"
  on public.meal_plans for delete to authenticated
  using (auth.uid() = user_id);

-- Re-create admin override policies (originally on the legacy table, dropped with it)
create policy "meal_plans_admin_select_all"
  on public.meal_plans for select to authenticated
  using (public.is_admin());

create policy "meal_plans_admin_update_all"
  on public.meal_plans for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "meal_plans_admin_delete_all"
  on public.meal_plans for delete to authenticated
  using (public.is_admin());

-- meal_plan_items: access through parent meal_plan ownership
alter table public.meal_plan_items enable row level security;

create policy "meal_plan_items_select_own"
  on public.meal_plan_items for select to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

create policy "meal_plan_items_insert_own"
  on public.meal_plan_items for insert to authenticated
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

create policy "meal_plan_items_update_own"
  on public.meal_plan_items for update to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id
        and mp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

create policy "meal_plan_items_delete_own"
  on public.meal_plan_items for delete to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

commit;
