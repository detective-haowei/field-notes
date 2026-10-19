# Field Notes

A day-by-day task tracker in a single HTML file: tasks with projects, people and
deadlines, dated updates with file attachments, work/PTO day marking with NZ public
holidays, search and filters, JSON export/import, and weekly PDF summaries.

Live at https://detective-haowei.github.io/field-notes/ (deployed by
`.github/workflows/deploy.yml` on every push to `main`).

## Accounts and sync (Supabase)

With a free [Supabase](https://supabase.com) project connected, the app asks you to
sign in and keeps tasks and attachments in your account, so every device sees the
same data. Without it, the app runs in local-only mode (data stays in this browser).

Setup, once:

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste the contents of `supabase/setup.sql`, and run it.
   This creates the tables, the private attachments bucket and the rules that
   limit each user to their own data.
3. Open **Project Settings -> API** and copy the **Project URL** and the
   **anon public** key into `config.js`. The anon key is designed to be public.
4. Commit and push. The site redeploys with sign-in turned on.
5. Optional: under **Authentication -> Providers -> Email**, turn off
   "Confirm email" if you want new accounts to sign in immediately.
6. Under **Authentication -> URL Configuration**, set the Site URL to the live
   address above so confirmation emails link back to the app.

To move existing local data into your account, use **Data -> Export** while in
local mode, sign in, then **Data -> Import**. File attachments are not included
in an export.

## Running locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```
