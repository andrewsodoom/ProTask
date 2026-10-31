# StudyDeck

A neon study and project analytics dashboard for one term at a time. Track coursework deadlines, run focus blocks, manage side builds, and keep the weekly timetable in one place.

Authentication and workspace data are stored in Supabase. Every account gets a private workspace protected by row-level security.

## Features

- **Cloud authentication** - email/password sign up and sign in with Supabase Auth, email confirmation support, profile updates and persistent sessions.
- **Private workspaces** - projects, assignments, lectures and study sessions are scoped to the signed-in user with Supabase row-level security.
- **Overview analytics** - live task, hour, accuracy and cycle-time metrics with sparklines and momentum charts.
- **Study log** - focus timer with 25/50/90 minute presets plus any custom length from 1 to 720 minutes, manual session entry, weekly rhythm chart, streaks, and session history.
- **Projects CRUD** - create, edit and delete builds with status, stack, progress, start date, deadline, estimated hours and accent colour.
- **Academic workspace** - weekly timetable with add/edit/delete lecture controls on every day, assignment CRUD, priorities, live deadline countdowns, and completion tracking.
- **Timetable import** - upload `.xlsx` or `.csv` timetables with a flat table, weekday grid, transposed weekday grid, or multi-sheet workbook; fuzzy headers and previews are supported before merging or replacing the week.
- **Dark and light themes** - persisted appearance toggle on auth screens, the sidebar, mobile header and settings, with theme-aware charts and custom accessible dropdowns.
- **Click sounds** - a subtle Mixkit click on buttons and links, with a persisted on/off toggle in Settings.
- **Settings** - theme and sound preferences, profile name, workspace snapshot, JSON backup export, sessions CSV export, clear-workspace action, and sign out.
- **Responsive shell** - desktop sidebar, mobile top bar and bottom navigation, animated route transitions, modals and toasts.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- React Router
- Framer Motion
- Recharts
- Lucide icons
- Supabase (`@supabase/supabase-js`)
- Oxlint

## Getting started

Requires Node.js 20+ and a Supabase project.

1. Create a project at [supabase.com](https://supabase.com).
2. Open the Supabase SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, indexes and row-level security policies.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key from Supabase **Project Settings > API**:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open the printed local URL. The app redirects to `/login` until you sign in or create an account.

### Supabase Auth settings

In Supabase **Authentication > URL Configuration**, set the Site URL to your production domain and add redirect URLs for local development and preview deployments, for example:

```text
http://localhost:5173
https://your-domain.example
https://your-preview-domain.example
```

If email confirmation is enabled, new users must confirm their address before signing in. The signup screen displays a confirmation notice in that case.

## Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # type-check and build to dist/
npm run preview  # serve the production build
npm run lint     # run Oxlint
```

## Architecture

- `AuthContext` wraps Supabase Auth, restores the persisted session, and exposes `signIn`, `signUp`, `signOut` and `updateName`.
- `DataContext` loads and mutates the signed-in user's rows in `projects`, `assignments`, `lectures` and `study_sessions`.
- `supabase/schema.sql` enables row-level security so each user can only read and write their own rows.
- Theme and sound preferences remain device-local; account and workspace data are stored in Supabase.
- Timetable files are parsed in the browser before the resulting lectures are saved to Supabase.
- Exports in Settings produce JSON and CSV backups for the signed-in account.

## Timetable import format

The import accepts `.xlsx` and `.csv` files. A flat table is the most reliable format:

| Day | Course | Title | Start | End | Location |
| --- | --- | --- | --- | --- | --- |
| Monday | CS 402 | Machine Learning | 09:00 | 10:30 | Room B204 |

Weekday-column grids also work, including grids with weekdays down the rows and times across the columns. The importer reads every sheet in an .xlsx workbook, accepts common header variants such as Course Name, Start Time, and Room Number, and uses the sheet with the most valid classes. The import preview shows parsed classes before anything is saved. Use the built-in template in the import dialog as a starting point.

## Deployment

The app is a static SPA backed by Supabase. Build with `npm run build` and serve `dist/`.

Set the same environment variables in your hosting provider:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Then add the production and preview domains to Supabase **Authentication > URL Configuration**.

### Vercel

Import the repository and use the Vite preset. Add the environment variables in the Vercel project settings. `vercel.json` rewrites all routes to `index.html` so deep links work, and adds cache and security headers.

### Netlify

Import the repository; `netlify.toml` sets the build command, publish directory, SPA redirect, headers and Node version. Add the environment variables in Netlify site settings. `public/_redirects` and `public/_headers` also cover drag-and-drop deployments of `dist/` and other static hosts that support those files.

### Other static hosts

Configure an SPA fallback that serves `index.html` for unknown paths. Serve `dist/` as the web root so `/assets/*` and `/sounds/*` resolve correctly. Add the Supabase environment variables and redirect domain to your host configuration.

## Credits

The button click sound is **Select click** from [Mixkit](https://mixkit.co/free-sound-effects/click/), used under the Mixkit free sound effects license.

## Project structure

```text
src/
  components/
    auth/        Auth split-screen shell
    layout/      Sidebar, mobile navigation, app shell, route guards
    ui/          Buttons, fields, custom selects, modals, badges, theme/sound toggles, toasts
  context/       Auth, workspace data, theme, sound and toast providers
  data/          Types and chart/metric builders
  lib/           Dates, storage helpers, Supabase client, tone maps, timetable import parser
  pages/         Overview, Study log, Projects, Academic, Settings, auth, 404
supabase/
  schema.sql     Tables, indexes and row-level security policies
```

## Verification

```bash
npm run lint
npm run build
```

The production build is type-checked with `tsc -b` before Vite emits `dist/`.
