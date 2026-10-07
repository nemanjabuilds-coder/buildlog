# BuildLog — setup and demo walkthrough

## 1. Connect a real Supabase project

1. Create a Supabase project you control.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](../supabase/schema.sql). This creates the tables, owner policies, and the narrowly scoped public portfolio RPC.
3. In **Authentication → Providers**, enable Email/Password. In **URL Configuration**, allow the current BuildLog Preview origin (and `http://localhost:3000` for local development). If you publish later, add that site's origin then.
4. Provide the Supabase **Project URL** and **anon/publishable public key** through the protected project input card. For Preview, choose **Development**. Never use or enter a `service_role` key in this Angular app.
5. Reload/restart Preview after the development values are saved. If you run locally instead, copy `.env.example` to `.env`, fill in the two public-client values, and run `pnpm start`.

Until these steps are complete, BuildLog deliberately shows a setup state instead of pretending to authenticate or save data. The SQL has been syntax-parsed locally, but has not yet been applied to a live Supabase project.

## 2. A five-minute feature walkthrough

1. Create an account and complete email confirmation if Supabase requires it; then sign in.
2. Create a learning project with a short description, goals, technology tags, target date, progress, and repository/demo links.
3. Use the dashboard keyword search plus status and technology filters.
4. Open the project, add milestones, and record one work note, one challenge, and one takeaway. Keep at least one learning note private.
5. Turn on public sharing for that project and mark only selected milestones/notes public. Open the generated portfolio link in a signed-out/private window.
6. Confirm the public page contains only the intentionally shared project details and public child entries—not private notes, ownership IDs, or row UUIDs. Turn sharing off again if you do not want the link active.

## 3. Code tour

- `src/app/core/auth/auth.service.ts` — Supabase email sign-up/sign-in/sign-out and persisted-session restoration.
- `src/app/core/auth/auth.guard.ts` — the navigation guard; it improves user flow but is not the security boundary.
- `src/app/core/data/projects.service.ts` — typed owner-scoped CRUD and the public RPC call.
- `src/app/core/models/database.types.ts` — the TypeScript row, insert/update, and public-payload contracts.
- `supabase/schema.sql` — table constraints, per-user RLS, and `get_public_portfolio`; RLS is the database-side security boundary for private records.
- `src/app/features/` — the auth, dashboard, project editor/detail, and read-only portfolio views.

## 4. Discuss it accurately

A straightforward way to introduce it is: “I made this as a learning project to practice Angular, TypeScript, and Supabase. I used AI assistance for parts of the implementation, and I’m working through the code so I can explain the decisions and improve it. I’d value your developers’ feedback on what I should tackle next.”

Be clear about which pieces you can explain confidently and which are still new to you. Useful topics to review before the call: how the route guard differs from RLS, how the public RPC avoids returning internal IDs, and what you would add next (for example, automated tests and a deployment pipeline).
