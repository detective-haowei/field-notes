# Field Notes

A day-by-day task tracker: tasks with projects, people and deadlines, dated
updates with file attachments, work/PTO day marking with NZ public holidays,
search and filters, JSON export/import, and weekly PDF summaries.

Live at https://detective-haowei.github.io/field-notes/ (deployed by
`.github/workflows/deploy.yml` on every push to `main`).

## Running locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

| Script                | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Dev server with hot reload                          |
| `npm run build`       | Type-check, then build to `dist/`                   |
| `npm run preview`     | Serve the built `dist/` to check a production build |
| `npm run typecheck`   | Type-check only                                     |
| `npm run deps:add`    | Add a package, honouring the cooldown below         |
| `npm run deps:update` | Update packages, honouring the cooldown             |
| `npm run deps:check`  | Verify nothing in the lockfile is too new           |

## Dependency cooldown

Packages must be **at least 2 days old** before this project will pick them up.
When a maintainer account is taken over, the malicious release is usually caught
and unpublished within hours, so waiting keeps it out of our lockfile entirely.

Add or update packages through the wrapper, which passes npm a `--before` date
so the resolver cannot see anything newer — for direct dependencies and
everything they pull in:

```sh
npm run deps:add -- some-package
npm run deps:add -- --save-dev some-package
npm run deps:update
```

`npm install` with no arguments and `npm ci` only replay the lockfile, so they
are unaffected and need no wrapper.

A plain `npm install some-package` skips the wrapper, so `npm run deps:check` is
the backstop. It compares the lockfile against git HEAD and checks the publish
date of anything that changed, failing if it is inside the window. With nothing
changed it makes no network requests at all; `--all` sweeps every package
instead. CI runs it before every build, so a too-new package cannot reach `main`
even if it reaches someone's working tree.

The window lives in one place, `scripts/cooldown.mjs`.

## Project layout

React + TypeScript, built with Vite.

```
public/
  config.js        Supabase credentials, read at runtime (not bundled)
  sw.js            Retires the service worker an earlier version installed
scripts/
  cooldown.mjs              The cooldown window, shared by the two below
  npm-cooldown.mjs          Runs npm with --before set to the cutoff
  check-dependency-age.mjs  Fails if the lockfile gained anything too new
src/
  main.tsx         Entry point; mounts <App> inside the store provider
  App.tsx          Sign-in gate, page frame, Manage dialog
  types.ts         Task, Update, Attachment, DayType and friends
  api/             Everything that talks to the outside world
    backend.ts            Picks where data lives and returns one Backend
    supabase.ts           Accounts, the items table, realtime, file storage
    localStore.ts         localStorage tasks/days + IndexedDB attachments
    claudeArtifact.ts     The store available when hosted as a Claude artifact
    assetUrls.ts          Attachment id -> URL registry components subscribe to
    exportImport.ts       Export payload and import parsing
    pdf.ts                Weekly summary PDF (jsPDF, loaded on demand)
    download.ts           Saving a file through the host or the browser
  lib/             Pure logic, no React and no I/O
    dates.ts              Day keys, labels, relative times
    holidays.ts           NZ public holidays and day types
    tasks.ts              Which tasks are active, filtering, day counts
    week.ts               Shaping a week for the summary
    tags.ts               Projects and people
    text.tsx              Links, @mentions and search highlighting
    schema.ts             Validating imported data
    files.ts, ids.ts
  hooks/           Reusable behaviour (dismiss, media query, auto-resize, ...)
  store/           App state: StoreContext (data), ViewContext (selection,
                   filters), pendingAttachments (uploads in flight)
  components/      One file per piece of UI
  styles/          One stylesheet per area, imported by styles/index.css
```

The rules of thumb: `lib/` is pure and testable, `api/` is the only place that
touches the network, storage or the file system, `store/` holds state, and
components render.

## Accounts and sync (Supabase)

With a free [Supabase](https://supabase.com) project connected, the app asks you
to sign in and keeps tasks and attachments in your account, so every device sees
the same data. Without it, the app runs in local-only mode (data stays in this
browser, attachments in IndexedDB).

Setup, once:

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste the contents of `supabase/setup.sql`, and run it.
   This creates the tables, the private attachments bucket and the rules that
   limit each user to their own data.
3. Open **Project Settings -> API** and copy the **Project URL** and the
   **anon public** key into `public/config.js`. The anon key is designed to be
   public; `config.js` is served as-is rather than bundled, so it can be changed
   without rebuilding.
4. Commit and push. The site redeploys with sign-in turned on.
5. Optional: under **Authentication -> Providers -> Email**, turn off
   "Confirm email" if you want new accounts to sign in immediately.
6. Under **Authentication -> URL Configuration**, set the Site URL to the live
   address above so confirmation emails link back to the app.

To move existing local data into your account, use **Data -> Export** while in
local mode, sign in, then **Data -> Import**. File attachments are not included
in an export.

## Attachments

Files are attached to an **update**, not to a task: open a task, then use the
paperclip in its "Add an update" box. Files can also be pasted or dragged onto
that box. Images, video, PDFs and text files up to 20 MB are accepted. They go
to the private Supabase bucket when signed in, and to IndexedDB in this browser
otherwise.
