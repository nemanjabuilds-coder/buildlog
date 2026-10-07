# BuildLog

A learning-project tracker built with Angular, TypeScript, and Supabase. It makes the work behind learning visible: project briefs, progress, milestones, and notes about completed work, challenges, and takeaways.

## What it includes

- Supabase email sign-up/sign-in with persistent sessions and protected application routes.
- A project dashboard with recent activity, technology/status filters, and keyword search.
- Validated project create/edit/delete flows and details for goals, links, dates, status, and progress.
- Milestones and learning entries, with per-entry public visibility controls.
- Read-only `/portfolio/:slug` pages that show only deliberately public project data.
- Supabase Postgres schema and row-level security policies in `supabase/schema.sql`.

## Run locally

1. Install the pinned toolchain and dependencies: `pnpm install`.
2. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the environment (or in a local `.env` file, which is git-ignored). Never use a service-role key in the browser.
4. Start the app with `pnpm start` and open `http://localhost:3000`.
5. Check TypeScript with `pnpm typecheck` and create a production build with `pnpm build`.

The `prestart` and `prebuild` hooks create `public/runtime-config.js` from the two environment variables. Node's `--env-file-if-exists` flag loads a local `.env` when present; values already supplied by the platform environment take precedence. The generated file is ignored by Git. If the values are absent, the sign-in page shows an honest setup notice and does not simulate a signed-in user.

## Supabase setup

In the Supabase dashboard, enable email/password authentication and set the allowed site URL/redirect URLs to the application's local and deployed origins. Run `supabase/schema.sql` in the SQL Editor. The database uses `auth.users` ownership and RLS policies so authenticated owners can manage only their own projects, milestones, and learning entries. Anonymous visitors have no `SELECT` access to the base tables; the `get_public_portfolio` RPC returns a narrow presentation-only projection for the requested public slug, including only public milestones and learning entries. It does not return owner IDs or row UUIDs, and private notes remain inaccessible.

Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` in protected environment configuration. The anon key is intended for browser use and is not a substitute for RLS. Do not add a Supabase service-role key to this frontend.
