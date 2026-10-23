# WORLDFORGE — project context

Read with [AGENTS.md](AGENTS.md). This is the compact architecture reference; [README.md](README.md) has user instructions and recovery procedures. Verify task-relevant source when changing behavior; this document is not evidence that tests currently pass.

## Purpose and workflow

A personal, local-first worldbuilding encyclopedia and interactive atlas. The user's setting centers on **one deeply developed fantasy city and its surrounding fantasy ocean**; neighboring cities and nations are mostly offscreen. Favor connected lore and easy navigation over many empty categories. Do not invent established lore.

Workflow: write entries and short descriptions, organize categories, nest locations and link their inhabitants/history/factions, then place entry-linked pins on uploaded maps. Multiple independent worlds share one server. The sidebar world box offers switching/creation; the banner’s single pencil opens name/description/banner editing. New entry sits beside search/sorting; category navigation lives only in the sidebar. Added worlds start empty; the original library remains the default world. The browser remembers its last selection; already-open tabs keep their own world. No login, paid service, external API, or cloud storage is required. Cloud-workspace files live on that machine.

## Stack, commands and tests

- Plain HTML/CSS/browser JavaScript; Node.js **24+**, CommonJS server modules and built-in `node:sqlite`. No frontend framework or build step.
- Runtime dependencies: `sharp` validates/decodes images; `archiver` streams ZIP exports; `yauzl` reads/validates ZIP imports. Playwright is the test dependency.
- `npm ci`: install locked dependencies on first setup or after lockfile/dependency changes; unnecessary for every task when already installed.
- `npm start`: `node server.js`, default `http://localhost:3000`, bound to `127.0.0.1`. `PORT` overrides the port. Serve through Node, not by opening `index.html` directly.
- `npm test`: `playwright test`. Target an affected suite with `npx playwright test tests/geography.spec.js` (substitute the relevant suite).
- If `/usr/bin/chromium` exists, test configuration uses it; otherwise install Playwright Chromium with `npx playwright install chromium`. Unprepared Linux hosts may need `npx playwright install --with-deps chromium` (CI uses this).
- Tests import `tests/fixtures.js`: each library uses an OS temporary `worldforge-test-*` directory, its own server, an assigned port, and restart/cleanup helpers. The fixture overrides the config URL. CI uses Node 24/Chromium; configuration is not proof of a passing run.

## Source map — inspect related files together

| Files | Responsibility / usual inspection scope |
| --- | --- |
| `index.html`, `styles.css`, `theme.js` | Page/dialog markup, responsive styles, Light/Dark/System preference (Light default; stored in browser). Theme control is in the top bar/map toolbar. |
| `app.js` | Entry CRUD/search/timeline, categories, shared entry editor/detail, save orchestration, linked-pin snapshots and entry deletion coordination. |
| `api-client.js`, `server.js` | Browser `fetch` client and local HTTP routes. Revision tracking, same-origin/write-header guards, serialized writes, image serving and an explicit static-file allowlist. |
| `worlds.js` | SQLite world catalogue, validated profiles, isolated Store directories and global immutable-image lookup. Read with API/server/backups for world isolation. |
| `storage.js` | SQLite schema/transactions, JSON entry/map payloads, category/canvas/pin records, validation, image metadata/files, older-schema upgrades and legacy image conversion. |
| `backups.js` | Portable exports, staged ZIP validation/restore, rollback checkpoints and legacy import/migration. Read with storage and API modules for persistence changes. |
| `geography-model.js`, `geography.js` | Shared browser/server location normalization, validation and deletion planning; nested browser, optional editor fields, breadcrumbs and lore links. Read with `app.js`/storage for relationship changes. |
| `maps.js`, `symbols.js` | Map collection/full-viewport editor, independent canvases/pins, zoom/pan/drag, linked detail/hover views; fixed SVG symbols/default categories shared with server validation. Read with app/storage/backups for pin or image changes. |
| `package.json`, `package-lock.json`, `playwright.config.js`, `tests/fixtures.js`, `.github/workflows/node.js.yml` | Dependency/command definitions, test isolation/browser setup and CI. |
| `tests/app.spec.js`, `tests/atlas.spec.js`, `tests/maps.spec.js`, `tests/workspace.spec.js`, `tests/storage.spec.js`, `tests/geography.spec.js`, `tests/worlds.spec.js` | Encyclopedia; linked pins/categories; map interactions/workspace; persistence/backups/migrations; geography and world-isolation regressions. Choose by affected flow, not filename alone. |

Browser modules use shared globals rather than imports. Preserve script order in `index.html`; new served scripts also need the server allowlist. UI modules share `entries`/`persist()` from `app.js`; saves send a **full metadata revision**. Only successful saves replace in-memory state. Requests carry `X-Worldforge-World` (default `default`); download links use `?world=<id>`. Image IDs resolve across world libraries so existing stable image URLs need no rewrite. Render user text with DOM text APIs; SVG markup comes from the fixed symbol vocabulary.

## Data, compatibility and existing behavior

- Library root: `WORLDFORGE_DATA_DIR` or `data/` beside `server.js`. Contains `worldforge.sqlite`, possible `-wal`/`-shm` files, `images/`, `backups/` and `staging/`. Each Store also has an additive `world_appearance` table holding an optional managed banner image; missing appearance fields preserve the current banner for old clients/imports. Banner references participate in metadata revision checks, validation and ZIP image remapping. The original database also holds the additive `world_catalog` table (id/title/description/profile revision); added libraries live under `worlds/<generated UUID>/` with their own database, images, backups and staging. The first catalogue creation on an initialized library makes and integrity-checks a `before-worlds-*.sqlite` snapshot; existing content tables are not rewritten. Default `data/` is Git-ignored but **real user data**, not disposable.
- Images are immutable files with generated filenames, `/api/images/<id>` references and SQLite metadata/checksums; not base64 localStorage or database blobs. Duplicate bytes can be reused. Limits: 50 MB / 80 million pixels per image; entries accept PNG/JPEG/WebP/GIF, map upload UI PNG/JPEG/WebP. Removed/cancelled images are retained and exported; no unused-image cleanup exists.
- **SQLite schema 5; API/ZIP format 6** (independent versions). Old clients cannot PUT earlier API formats. Schema 3/4 upgrades take a SQLite snapshot before transactional conversion. Geography adds optional `entry.location` JSON, not new tables or a separate database; old entries need no rewrite.
- Entries include category name, title, description, optional `summary`, tags, year, image reference and timestamp. Magic/Bestiary are included in customizable categories. History's special year UI depends on the name `History`. Keep unknown/older payload fields when editing.
- Geography supports 12 location types, optional grouped fields and ID-based links. Location identity is category `Locations` **or** a location object. Parents must be locations; cycles/missing targets are rejected. Deleting a parent moves direct children to its parent/top level, not cascading deletion. Other references are cleaned; travel notes retain former-destination labels. Limits: 64 hierarchy levels, 500 links/list, 100 travel rows; travel estimates are manual.
- Maps may start without images; ordered canvases each own their pins. Permanent pin coordinates are **normalized x/y in [0,1]**, relative to that image. Linked entries supply live titles/images/descriptions; entry deletion keeps standalone pin snapshots. Multi-upload, image management, fantasy symbols, hover previews, left reading panel, pan/zoom and optional browser fullscreen already exist.
- ZIP export covers only the selected world: `manifest.json` plus **all registered image files in that world**. An optional `world` profile is included without changing archive format 6; restore deliberately retains the destination world’s name/description. Export each world separately for portable backups, or stop the server and copy the entire root data folder to preserve the catalogue and every world. Restore validates records, paths, checksums/images and references, creates a rollback ZIP, then replaces records transactionally. Accepts ZIP 3–6 and legacy JSON arrays/versions 1–2; version 1 preserves current maps. Legacy browser key `worldforge.entries.v1` is migrated idempotently with original JSON/checkpoints preserved and the original browser value untouched.

## Library safety and current limits

Use fixture-created temporary folders or an isolated copy with `WORLDFORGE_DATA_DIR` for experiments, never the real library. Preserve the **whole** data folder across code updates. Copy it only with the server stopped (a live SQLite file alone may omit WAL transactions), or use a complete portable ZIP. For risky migration/restore work, verify backup contents/recovery in an isolated folder first; see README for rollback steps.

Not implemented: world deletion, cross-world lore links, one-click all-world ZIP backups, image overlays/layers, custom uploaded marker symbols, category deletion, rich text, pinch zoom or a standalone image gallery/cleanup. All metadata loads/saves together; large libraries may eventually need pagination/per-record APIs. Documented platform coverage is Linux/Chromium, not every OS/browser or power-loss/large-library scenario. Report actual checks per task.
