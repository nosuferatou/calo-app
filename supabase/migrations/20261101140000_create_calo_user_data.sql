create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  age_years integer,
  biological_sex text check (biological_sex in ('female', 'male')),
  height_cm numeric check (height_cm is null or height_cm > 0),
  current_weight_kg numeric check (current_weight_kg is null or current_weight_kg > 0),
  activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'very-active', 'extra-active')
  ),
  workout_days_per_week smallint check (
    workout_days_per_week between 0 and 7
  ),
  fitness_goal text check (
    fitness_goal in ('weight-loss', 'maintenance', 'muscle-gain')
  ),
  target_weight_kg numeric check (target_weight_kg is null or target_weight_kg > 0),
  desired_rate_kg_per_week numeric check (
    desired_rate_kg_per_week is null or desired_rate_kg_per_week >= 0
  ),
  macro_preference text check (
    macro_preference in ('balanced', 'higher-protein', 'custom')
  ),
  custom_protein_percent numeric,
  custom_fat_percent numeric,
  custom_carb_percent numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_custom_macro_split_valid check (
    (
      custom_protein_percent is null
      and custom_fat_percent is null
      and custom_carb_percent is null
    )
    or (
      custom_protein_percent is not null
      and custom_fat_percent is not null
      and custom_carb_percent is not null
      and custom_protein_percent between 10 and 35
      and custom_fat_percent between 20 and 35
      and custom_carb_percent between 45 and 65
      and custom_protein_percent + custom_fat_percent + custom_carb_percent = 100
    )
  )
);

create table public.nutrition_targets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calories numeric not null check (calories >= 0),
  protein numeric not null check (protein >= 0),
  carbohydrates numeric not null check (carbohydrates >= 0),
  fat numeric not null check (fat >= 0),
  source text check (source in ('manual', 'calculated')),
  bmr numeric,
  tdee numeric,
  activity_pal numeric check (activity_pal is null or activity_pal > 0),
  formula_version smallint check (formula_version is null or formula_version = 1),
  calculated_at timestamptz,
  requested_deficit_kcal numeric check (
    requested_deficit_kcal is null or requested_deficit_kcal >= 0
  ),
  actual_deficit_kcal numeric check (
    actual_deficit_kcal is null or actual_deficit_kcal >= 0
  ),
  calorie_guardrail_kcal numeric check (
    calorie_guardrail_kcal is null or calorie_guardrail_kcal > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  log_date date not null,
  meal_category text not null check (
    meal_category in ('breakfast', 'lunch', 'dinner', 'snack')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date, meal_category, id)
);

create table public.food_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  session_id text,
  log_date date not null,
  meal_category text not null check (
    meal_category in ('breakfast', 'lunch', 'dinner', 'snack')
  ),
  food_id text not null,
  name text not null check (length(name) > 0),
  grams numeric not null check (grams >= 0),
  serving_label text,
  logged_at timestamptz not null,
  calories numeric not null check (calories >= 0),
  protein numeric not null check (protein >= 0),
  carbohydrates numeric not null check (carbohydrates >= 0),
  fat numeric not null check (fat >= 0),
  fiber numeric check (fiber is null or fiber >= 0),
  sugar numeric check (sugar is null or sugar >= 0),
  saturated_fat numeric check (saturated_fat is null or saturated_fat >= 0),
  sodium numeric check (sodium is null or sodium >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint food_entries_session_owner_fk
    foreign key (user_id, log_date, meal_category, session_id)
    references public.meal_sessions (user_id, log_date, meal_category, id)
    on delete cascade
);

create index food_entries_user_date_category_idx
  on public.food_entries (user_id, log_date, meal_category);
create index food_entries_user_session_idx
  on public.food_entries (user_id, session_id);

create table public.custom_foods (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (length(name) > 0),
  category text not null check (
    category in (
      'rice-grains', 'meat', 'seafood', 'vegetables', 'fruits',
      'dairy', 'beverages', 'snacks', 'others'
    )
  ),
  default_grams numeric not null check (default_grams > 0),
  calories numeric not null check (calories >= 0),
  protein numeric not null check (protein >= 0),
  carbohydrates numeric not null check (carbohydrates >= 0),
  fat numeric not null check (fat >= 0),
  fiber numeric not null check (fiber >= 0),
  sugar numeric not null check (sugar >= 0),
  saturated_fat numeric not null check (saturated_fat >= 0),
  sodium numeric not null check (sodium >= 0),
  synonyms text[] not null default '{}',
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.favorite_foods (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  catalog_food_id text,
  custom_food_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint favorite_foods_exactly_one_target check (
    (catalog_food_id is not null and custom_food_id is null)
    or (catalog_food_id is null and custom_food_id is not null)
  ),
  constraint favorite_foods_custom_food_owner_fk
    foreign key (user_id, custom_food_id)
    references public.custom_foods (user_id, id)
    on delete cascade
);

create unique index favorite_foods_user_catalog_id_idx
  on public.favorite_foods (user_id, catalog_food_id)
  where catalog_food_id is not null;
create unique index favorite_foods_user_custom_food_id_idx
  on public.favorite_foods (user_id, custom_food_id)
  where custom_food_id is not null;

create table public.saved_meals (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (length(name) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.saved_meal_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  saved_meal_id text not null,
  position integer not null check (position >= 0),
  grams numeric not null check (grams >= 0),
  food_snapshot jsonb not null check (jsonb_typeof(food_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, saved_meal_id, position),
  constraint saved_meal_items_meal_owner_fk
    foreign key (user_id, saved_meal_id)
    references public.saved_meals (user_id, id)
    on delete cascade
);

create table public.weight_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  weight_kg numeric not null check (weight_kg > 0),
  logged_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index weight_records_user_logged_at_idx
  on public.weight_records (user_id, logged_at);

create table public.meal_cart_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  id text not null,
  log_date date not null,
  meal_category text not null check (
    meal_category in ('breakfast', 'lunch', 'dinner', 'snack')
  ),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null check (theme in ('light', 'dark', 'system')),
  language text not null check (language in ('en', 'id')),
  catalog_view_mode text check (
    catalog_view_mode is null or catalog_view_mode in ('grid', 'list')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.search_history (
  user_id uuid primary key references auth.users (id) on delete cascade,
  queries text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.meal_sessions enable row level security;
alter table public.food_entries enable row level security;
alter table public.custom_foods enable row level security;
alter table public.favorite_foods enable row level security;
alter table public.saved_meals enable row level security;
alter table public.saved_meal_items enable row level security;
alter table public.weight_records enable row level security;
alter table public.meal_cart_drafts enable row level security;
alter table public.account_preferences enable row level security;
alter table public.search_history enable row level security;

revoke all on table
  public.profiles,
  public.nutrition_targets,
  public.meal_sessions,
  public.food_entries,
  public.custom_foods,
  public.favorite_foods,
  public.saved_meals,
  public.saved_meal_items,
  public.weight_records,
  public.meal_cart_drafts,
  public.account_preferences,
  public.search_history
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.nutrition_targets,
  public.meal_sessions,
  public.food_entries,
  public.custom_foods,
  public.favorite_foods,
  public.saved_meals,
  public.saved_meal_items,
  public.weight_records,
  public.meal_cart_drafts,
  public.account_preferences,
  public.search_history
to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy nutrition_targets_select_own on public.nutrition_targets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy nutrition_targets_insert_own on public.nutrition_targets
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy nutrition_targets_update_own on public.nutrition_targets
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy nutrition_targets_delete_own on public.nutrition_targets
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy meal_sessions_select_own on public.meal_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy meal_sessions_insert_own on public.meal_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy meal_sessions_update_own on public.meal_sessions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy meal_sessions_delete_own on public.meal_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy food_entries_select_own on public.food_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy food_entries_insert_own on public.food_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy food_entries_update_own on public.food_entries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy food_entries_delete_own on public.food_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy custom_foods_select_own on public.custom_foods
  for select to authenticated using ((select auth.uid()) = user_id);
create policy custom_foods_insert_own on public.custom_foods
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy custom_foods_update_own on public.custom_foods
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy custom_foods_delete_own on public.custom_foods
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy favorite_foods_select_own on public.favorite_foods
  for select to authenticated using ((select auth.uid()) = user_id);
create policy favorite_foods_insert_own on public.favorite_foods
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy favorite_foods_update_own on public.favorite_foods
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy favorite_foods_delete_own on public.favorite_foods
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy saved_meals_select_own on public.saved_meals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_meals_insert_own on public.saved_meals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_meals_update_own on public.saved_meals
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy saved_meals_delete_own on public.saved_meals
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy saved_meal_items_select_own on public.saved_meal_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_meal_items_insert_own on public.saved_meal_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_meal_items_update_own on public.saved_meal_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy saved_meal_items_delete_own on public.saved_meal_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy weight_records_select_own on public.weight_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy weight_records_insert_own on public.weight_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy weight_records_update_own on public.weight_records
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy weight_records_delete_own on public.weight_records
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy meal_cart_drafts_select_own on public.meal_cart_drafts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy meal_cart_drafts_insert_own on public.meal_cart_drafts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy meal_cart_drafts_update_own on public.meal_cart_drafts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy meal_cart_drafts_delete_own on public.meal_cart_drafts
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy account_preferences_select_own on public.account_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy account_preferences_insert_own on public.account_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy account_preferences_update_own on public.account_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy account_preferences_delete_own on public.account_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy search_history_select_own on public.search_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy search_history_insert_own on public.search_history
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy search_history_update_own on public.search_history
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy search_history_delete_own on public.search_history
  for delete to authenticated using ((select auth.uid()) = user_id);
