# BuildLog — implementation plan

## Product scope

Build a compact, review-ready portfolio application for Nemanja to demonstrate practical Angular, TypeScript, and Supabase skills to Phil and his development team. It includes Supabase email authentication with persistent sessions and protected application routes; a learning-project dashboard and validated typed project CRUD; project details with goals, descriptions, repository/demo links, target dates, and completion progress; milestones and learning entries for completed work, challenges, and takeaways; status/technology/keyword search and filtering; a relational Supabase schema protected by per-user row-level security; responsive loading, empty, success, and error states; and a public read-only portfolio view shareable with Phil and the developers.

## Implementation approach

- Use Angular standalone components and TypeScript with the Angular Router, reactive forms, and a typed application data layer. Keep authentication, Supabase access, models, feature pages, and reusable interface elements in separate modules/folders.
- Use `@supabase/supabase-js` from a singleton client and an `AuthService` for email sign-up, sign-in, sign-out, persisted session restoration, and auth-state changes. Route guards protect dashboard and project routes; login/sign-up and the public portfolio remain accessible without a session. No fake identity or development-only authentication bypass.
- Store projects, milestones, and learning entries in Supabase Postgres. Provide a checked-in `supabase/schema.sql` for tables, indexes, constraints, RLS policies, and one narrowly scoped public-portfolio RPC. Authenticated CRUD policies bind private rows to `auth.uid()`. Anonymous sharing uses a fixed-search-path `SECURITY DEFINER` function that returns only presentation fields for the requested public slug and public child rows; anonymous users receive no base-table `SELECT` privilege, and private entries, owner IDs, and row UUIDs stay out of the public payload. Never ship a service-role key. The browser uses only the public anon key.
- Read the Supabase URL and anon key from a generated, git-ignored runtime configuration asset populated from environment variables by a small Node script. Load an optional git-ignored `.env` with Node's native `--env-file-if-exists` flag for local workflows. Include an `.env.example` and document the required Supabase setup. If runtime configuration is absent, show a clear setup state rather than pretending authentication or persistence works. Do not include protected values in source, Git, or logs.
- Use responsive Angular views for auth, dashboard, project create/edit/detail, and `/portfolio/:slug`. Keep public sharing read-only and allow the signed-in owner to control project/entry visibility. Implement accessible forms, explicit loading/error/empty/success feedback, and confirm destructive deletion.
- Build as a static Angular application on the project's existing Preview port (3000); no Manus server or Manus-managed database is needed because the requested backend is Supabase. Include `/manus-routes.json` for the complete set of client routes. Publication is not requested.

## Project structure

- `src/app/core/`: Supabase client/config, auth service, auth guard, typed data services, and shared application types.
- `src/app/features/auth/`: login and sign-up forms.
- `src/app/features/dashboard/`: project overview, recent activity, and status/technology/keyword filters.
- `src/app/features/projects/`: validated create/edit forms, project details, milestones, learning entries, and visibility controls.
- `src/app/features/portfolio/`: public, read-only project and learning showcase by share slug.
- `src/app/layout/`: authenticated desktop rail, mobile navigation, user identity, and sign-out controls.
- `src/app/app.routes.ts` and `src/app/app.config.ts`: route declarations and standalone router/bootstrap providers.
- `src/styles.scss`: responsive editorial workbench design tokens, typography, and global styles.
- `supabase/schema.sql`: relational schema, indexes, and RLS policies for private owner data and deliberately public portfolio records.
- `scripts/write-runtime-config.mjs`: emit ignored browser runtime configuration from environment variables without logging values.
- `public/manus-routes.json` and `public/brand-mark.svg`: route declaration and project mark.

## Design direction

- **Design Movement:** Editorial indie-software workbench: part developer notebook, part calm project studio; avoid generic SaaS dashboard conventions.
- **Core Principles:** Progress should be legible at a glance; the interface should feel like a useful personal record rather than a performance scoreboard; editing stays close to the work; public sharing is intentionally curated.
- **Color Philosophy:** Warm paper and soft stone backgrounds create a notebook-like canvas; deep ink provides confident contrast; a distinctive persimmon-coral accent signals actions and active progress; muted fern green marks completed work. Avoid noisy gradients and neon.
- **Layout Paradigm:** A slim, fixed desktop rail anchors the product while the main content reads like an editorial workbench with a generous title, compact progress summary, and vertically ordered project rows/cards. On mobile, the rail becomes a compact top navigation and content reflows into a single readable column.
- **Signature Elements:** A small stacked-page/route mark; thin ruled dividers with occasional coral ticks; restrained milestone dots connecting a project's learning timeline.
- **Interaction Philosophy:** Every action is explicit and reversible where possible; inline progress and status changes receive clear feedback; delete requires confirmation; public visibility is clearly labeled before it is enabled.
- **Animation:** Short 140–200 ms opacity/translate transitions for panels and controls; a restrained progress-bar fill on initial render; no looping or decorative motion; honor `prefers-reduced-motion`.
- **Typography System:** DM Sans for interface/body text and DM Mono for dates, tags, and code-like metadata, with system fallbacks. Use a compact, expressive title scale, readable body copy, and consistent label/caption sizing.
- **Brand Essence:** “A calm trail map for the projects you build while you learn.” Personality: curious, accountable, grounded.
- **Brand Voice:** Direct, human, and quietly encouraging. Example lines: “Small steps. Visible progress.” and “Pick up where you left off.”
- **Wordmark & Logo:** A custom two-page outline with a short route line and coral waypoint, paired with a distinctive BuildLog wordmark; use the mark in navigation and the favicon rather than a default icon.
- **Signature Brand Color:** Persimmon coral (`#D85D45`), reserved for the most important action, current state, and waypoint motif.

## Dependencies and constraints

Angular CLI/Angular, TypeScript, `@supabase/supabase-js`, and existing Node/pnpm tooling. The app remains fully honest about its dependency on a real Supabase project: email authentication, persistent records, per-user RLS, and personalized public links require the user's Supabase URL and anon key plus the supplied SQL schema. The keys will be requested only through the protected project input surface, never in chat. No Supabase service-role credential is used in the browser. Keep the project private/unpublished unless the user later asks to share or publish it.
