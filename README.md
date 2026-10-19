# Field Notes

Offline-first notes app for working in the field. Built as an installable PWA with
Vite, React and TypeScript. Notes are stored locally in IndexedDB, so the app keeps
working with no signal.

## Features

- Create, edit and delete notes with title, body and tags
- Attach your current GPS location to a note
- Search across titles, bodies and tags
- Works offline and can be installed to a phone's home screen

## Getting started

```sh
npm install
npm run dev       # start the dev server
npm test          # run unit tests
npm run build     # type-check and build to dist/
npm run preview   # serve the production build (service worker active)
```

Geolocation and service workers need a secure context: `localhost` works, but to
test on a phone over your LAN, serve over HTTPS (e.g. a tunnel).

## Layout

```
src/
  types.ts               Note data types
  db.ts                  IndexedDB storage and search helpers
  db.test.ts             Unit tests (fake-indexeddb)
  App.tsx                List/editor views, online status
  components/
    NoteList.tsx
    NoteEditor.tsx
```

## Ideas for next steps

- Photo attachments (store Blobs in IndexedDB)
- Export / import as JSON or CSV
- Map view of located notes
- Optional sync to a backend
