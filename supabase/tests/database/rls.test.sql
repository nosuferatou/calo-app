begin;
select no_plan();

insert into auth.users (id, aud, role, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'calo-a@test.invalid'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'calo-b@test.invalid'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'calo-c@test.invalid');

insert into public.profiles (user_id, display_name)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'User A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'User B');

insert into public.nutrition_targets (
  user_id, calories, protein, carbohydrates, fat, source
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1900, 120, 210, 60, 'manual'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2200, 140, 250, 70, 'calculated');

insert into public.meal_sessions (user_id, id, log_date, meal_category)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'session-a', '2026-10-31', 'breakfast'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'session-b', '2026-10-31', 'breakfast'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'session-c', '2026-10-31', 'breakfast');

insert into public.food_entries (
  user_id, id, session_id, log_date, meal_category, food_id, name, grams,
  logged_at, calories, protein, carbohydrates, fat
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'entry-a', 'session-a',
    '2026-10-31', 'breakfast', 'custom-a', 'Custom food A', 100,
    '2026-10-31 08:00:00+00', 123.45, 2.7, 28.2, 0.3
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'entry-b', 'session-b',
    '2026-10-31', 'breakfast', 'food-white-rice', 'Cooked rice', 150,
    '2026-10-31 08:00:00+00', 195, 4.05, 42.3, 0.45
  );

insert into public.custom_foods (
  user_id, id, name, category, default_grams, calories, protein,
  carbohydrates, fat, fiber, sugar, saturated_fat, sodium, source
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'custom-a', 'Custom food A',
    'others', 100, 100, 10, 10, 2, 1, 1, 1, 10, 'User provided'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'custom-b', 'Custom food B',
    'others', 100, 200, 20, 20, 4, 2, 2, 2, 20, 'User provided'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'custom-c', 'Custom food C',
    'others', 100, 300, 30, 30, 6, 3, 3, 3, 30, 'User provided'
  );

insert into public.favorite_foods (user_id, id, custom_food_id)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'favorite-a', 'custom-a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'favorite-b', 'custom-b');

insert into public.saved_meals (user_id, id, name)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'meal-a', 'Meal A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'meal-b', 'Meal B');

insert into public.saved_meal_items (
  user_id, saved_meal_id, position, grams, food_snapshot
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'meal-a', 0, 100,
    '{"id":"food-white-rice","name":"Cooked rice","calories":130}'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'meal-b', 0, 150,
    '{"id":"food-white-rice","name":"Cooked rice","calories":195}'
  );

insert into public.weight_records (user_id, id, weight_kg, logged_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'weight-a', 70.5, '2026-10-31 09:00:00+00'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'weight-b', 80.5, '2026-10-31 09:00:00+00');

insert into public.meal_cart_drafts (user_id, id, log_date, meal_category, items)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'draft-a', '2026-10-31',
    'breakfast', '[{"food":{"id":"food-white-rice","name":"Cooked rice"},"grams":100}]'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'draft-b', '2026-10-31',
    'breakfast', '[{"food":{"id":"food-white-rice","name":"Cooked rice"},"grams":150}]'
  );

insert into public.account_preferences (user_id, theme, language, catalog_view_mode)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'light', 'en', 'grid'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dark', 'id', 'list');

insert into public.search_history (user_id, queries)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', array['rice']),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', array['egg']);

select ok(
  (
    select count(*) = 12
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any (array[
        'profiles', 'nutrition_targets', 'meal_sessions', 'food_entries',
        'custom_foods', 'favorite_foods', 'saved_meals', 'saved_meal_items',
        'weight_records', 'meal_cart_drafts', 'account_preferences', 'search_history'
      ])
  ),
  'all CALO user-data tables exist'
);

select ok(
  (
    select count(*) = 12
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any (array[
        'profiles', 'nutrition_targets', 'meal_sessions', 'food_entries',
        'custom_foods', 'favorite_foods', 'saved_meals', 'saved_meal_items',
        'weight_records', 'meal_cart_drafts', 'account_preferences', 'search_history'
      ])
      and c.relrowsecurity
  ),
  'RLS is enabled on every CALO user-data table'
);

select ok(
  (
    select count(*) = 48
      and bool_and(roles @> array['authenticated']::name[])
      and bool_and(cmd in ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles', 'nutrition_targets', 'meal_sessions', 'food_entries',
        'custom_foods', 'favorite_foods', 'saved_meals', 'saved_meal_items',
        'weight_records', 'meal_cart_drafts', 'account_preferences', 'search_history'
      ])
  ),
  'each table has separate authenticated CRUD policies'
);

select ok(
  (
    select bool_and(
      not has_table_privilege(
        'anon',
        'public.' || table_name,
        'SELECT,INSERT,UPDATE,DELETE'
      )
      and has_table_privilege(
        'authenticated',
        'public.' || table_name,
        'SELECT,INSERT,UPDATE,DELETE'
      )
      and not has_table_privilege('authenticated', 'public.' || table_name, 'TRUNCATE')
    )
    from unnest(array[
      'profiles', 'nutrition_targets', 'meal_sessions', 'food_entries',
      'custom_foods', 'favorite_foods', 'saved_meals', 'saved_meal_items',
      'weight_records', 'meal_cart_drafts', 'account_preferences', 'search_history'
    ]) as table_name
  ),
  'client grants exclude anon and limit authenticated to CRUD'
);

set local role anon;
select throws_ok(
  $$select user_id from public.profiles$$,
  '42501',
  null,
  'anonymous role cannot read private profile data'
);
select throws_ok(
  $$select user_id from public.food_entries$$,
  '42501',
  null,
  'anonymous role cannot read private diary entries'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is((select count(*) from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own profile');
select is((select count(*) from public.nutrition_targets where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own targets');
select is((select count(*) from public.meal_sessions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own sessions');
select is((select count(*) from public.food_entries where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own entries');
select is((select count(*) from public.custom_foods where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own custom foods');
select is((select count(*) from public.favorite_foods where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own favorites');
select is((select count(*) from public.saved_meals where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own saved meals');
select is((select count(*) from public.saved_meal_items where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own saved meal items');
select is((select count(*) from public.weight_records where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own weight records');
select is((select count(*) from public.meal_cart_drafts where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own meal cart draft');
select is((select count(*) from public.account_preferences where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own preferences');
select is((select count(*) from public.search_history where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'owner can read own search history');

select is((select count(*) from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another profile');
select is((select count(*) from public.nutrition_targets where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another target');
select is((select count(*) from public.meal_sessions where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another session');
select is((select count(*) from public.food_entries where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another diary entry');
select is((select count(*) from public.custom_foods where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another custom food');
select is((select count(*) from public.favorite_foods where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another favorite');
select is((select count(*) from public.saved_meals where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another saved meal');
select is((select count(*) from public.saved_meal_items where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another saved meal item');
select is((select count(*) from public.weight_records where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another weight record');
select is((select count(*) from public.meal_cart_drafts where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another meal cart draft');
select is((select count(*) from public.account_preferences where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another account preference');
select is((select count(*) from public.search_history where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'owner cannot read another search history');

select throws_ok(
  $$insert into public.profiles (user_id, display_name) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Not owner')$$,
  '42501', null, 'profile insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.nutrition_targets (user_id, calories, protein, carbohydrates, fat) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 1000, 50, 100, 30)$$,
  '42501', null, 'target insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.meal_sessions (user_id, id, log_date, meal_category) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'session-x', '2026-10-31', 'breakfast')$$,
  '42501', null, 'session insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.food_entries (user_id, id, session_id, log_date, meal_category, food_id, name, grams, logged_at, calories, protein, carbohydrates, fat) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'entry-x', 'session-c', '2026-10-31', 'breakfast', 'food-white-rice', 'Rice', 100, '2026-10-31 08:00:00+00', 130, 2, 28, 1)$$,
  '42501', null, 'entry insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.custom_foods (user_id, id, name, category, default_grams, calories, protein, carbohydrates, fat, fiber, sugar, saturated_fat, sodium, source) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'custom-x', 'Food', 'others', 100, 1, 1, 1, 1, 1, 1, 1, 1, 'test')$$,
  '42501', null, 'custom food insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.favorite_foods (user_id, id, custom_food_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'favorite-x', 'custom-c')$$,
  '42501', null, 'favorite insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.saved_meals (user_id, id, name) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'meal-x', 'Meal')$$,
  '42501', null, 'saved meal insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.saved_meal_items (user_id, saved_meal_id, position, grams, food_snapshot) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'meal-b', 9, 100, '{"id":"food-white-rice"}')$$,
  '42501', null, 'saved meal item insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.weight_records (user_id, id, weight_kg, logged_at) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'weight-x', 70, now())$$,
  '42501', null, 'weight record insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.meal_cart_drafts (user_id, id, log_date, meal_category) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'draft-x', '2026-10-31', 'breakfast')$$,
  '42501', null, 'meal cart draft insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.account_preferences (user_id, theme, language) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'light', 'en')$$,
  '42501', null, 'preference insert cannot assign another owner'
);
select throws_ok(
  $$insert into public.search_history (user_id, queries) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', array['private'])$$,
  '42501', null, 'search history insert cannot assign another owner'
);

select throws_ok(
  $$update public.profiles set user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501',
  null,
  'UPDATE WITH CHECK prevents ownership transfer'
);
select lives_ok(
  $$update public.profiles set display_name = 'Changed by A' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'owner cannot update another profile'
);
select lives_ok(
  $$delete from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'owner cannot delete another profile'
);

select throws_ok(
  $$insert into public.saved_meal_items (user_id, saved_meal_id, position, grams, food_snapshot) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'meal-b', 9, 100, '{"id":"food-white-rice"}')$$,
  '23503',
  null,
  'a user''s saved meal item cannot reference another user''s meal'
);
select throws_ok(
  $$insert into public.favorite_foods (user_id, id, custom_food_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'favorite-cross', 'custom-b')$$,
  '23503',
  null,
  'a favorite cannot reference another user''s custom food'
);
select throws_ok(
  $$insert into public.food_entries (user_id, id, session_id, log_date, meal_category, food_id, name, grams, logged_at, calories, protein, carbohydrates, fat) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'entry-cross', 'session-b', '2026-10-31', 'breakfast', 'food-white-rice', 'Rice', 100, '2026-10-31 08:00:00+00', 130, 2, 28, 1)$$,
  '23503',
  null,
  'a diary entry cannot reference another user meal session'
);

select lives_ok(
  $$update public.nutrition_targets set calories = 2000 where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  'owner can update own nutrition targets'
);
select lives_ok(
  $$delete from public.weight_records where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and id = 'weight-a'$$,
  'owner can delete own weight record'
);

select lives_ok(
  $$update public.custom_foods set calories = 999 where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and id = 'custom-a'$$,
  'owner can update own custom food'
);
select is(
  (select calories from public.food_entries where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and id = 'entry-a'),
  123.45::numeric,
  'diary nutrition snapshot stays unchanged when custom food data changes'
);

reset role;
select throws_ok(
  $$insert into public.nutrition_targets (user_id, calories, protein, carbohydrates, fat) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', -1, 0, 0, 0)$$,
  '23514',
  null,
  'nutrition targets reject negative calories'
);
select throws_ok(
  $$insert into public.profiles (user_id, custom_protein_percent, custom_fat_percent, custom_carb_percent) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 20, null, 60)$$,
  '23514',
  null,
  'custom macro split requires all valid percentages'
);
select is(
  (select display_name from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'User B',
  'cross-user UPDATE and DELETE left the other profile unchanged'
);
select is(
  (select count(*) from public.weight_records where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  1::bigint,
  'another user’s weight record remains after an unauthorized delete attempt'
);
select is(
  (select calories from public.nutrition_targets where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  2000::numeric,
  'owner update persisted'
);

select * from finish();
rollback;
