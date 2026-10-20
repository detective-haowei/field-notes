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
