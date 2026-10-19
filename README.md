# Field Notes

A day-by-day task tracker in a single HTML file: tasks with projects, people and
deadlines, dated updates, work/PTO day marking with NZ public holidays, search and
filters, JSON export/import, and weekly PDF summaries.

Live at https://detective-haowei.github.io/field-notes/ (deployed by
`.github/workflows/deploy.yml` on every push to `main`).

## Data

When hosted as a plain web page, tasks are saved in the browser's `localStorage`,
so they stay on the device and browser you use. Use **Data → Export** to back up
or move them, and **Data → Import** to load a backup.

File attachments on updates only appear when the app runs as a Claude artifact,
which provides file storage.

## Running locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```
