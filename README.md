# WORLDFORGE

A free worldbuilding encyclopedia and interactive atlas, stored on your own computer. No accounts, external APIs, or paid services.

## Start the updated app

1. **Before upgrading**, use **Export backup** in your old app and keep that file.
2. Install **Node.js 24 LTS or newer** from nodejs.org. SQLite is included with Node; you do not install a separate database service.
3. Download/unzip the project. Open a terminal in the WORLDFORGE folder. On Windows, open the folder in File Explorer, type `cmd` in the address bar, and press Enter.
4. Run these commands, one at a time:

   ```sh
   npm ci
   npm start
   ```

5. Open `http://localhost:3000` in your browser. Leave the terminal open. Press Ctrl+C to stop the server; run `npm start` to start it again.

The first command installs dependencies once and needs Internet access. Normal use runs locally and works offline. Opening `index.html` directly is no longer supported. The server listens only on this computer (127.0.0.1); this is not a public website. If you run it in a cloud workspace, files live on that workspace's machine—download and run it on your computer for local ownership.

Use the same browser and exact address as your old version for automatic migration. `localhost` and `127.0.0.1` have separate old browser storage. Once migrated, all browsers using this server share the SQLite library.

## Where your world lives

By default, the server creates a **data** folder beside `server.js`:

```text
data/
  worldforge.sqlite       Entries, categories, maps, pins, image metadata, migration history
  worldforge.sqlite-wal   SQLite working files (may exist while running)
  worldforge.sqlite-shm
  images/                 Original image files with generated names
  backups/                Migration JSON, database snapshots and rollback ZIPs
  staging/                Temporary uploads and restore files
```

**Keep this folder when updating the app.** Do not replace it with an empty folder from a new download. If you unzip a new project folder, stop the server and copy your entire old `data` folder into the new project before starting it.

For a permanent location outside the application folder, set `WORLDFORGE_DATA_DIR` before starting. This variable names the root of the whole library, not an individual database file:

Windows Command Prompt:

```bat
set "WORLDFORGE_DATA_DIR=C:\Users\YourName\Documents\WorldforgeData"
npm start
```

macOS/Linux:

```sh
WORLDFORGE_DATA_DIR="$HOME/Documents/WorldforgeData" npm start
```

Use that same location each time. The terminal prints the active data folder at startup. Move/copy the **whole folder while the server is stopped**, or use a portable backup. Do not copy just the SQLite file while the server is running; recent transactions may be in its WAL file. Store the database on a local writable disk rather than a network share or live cloud-sync folder.

## Entries and maps

Click **New entry** to write a character, location, historical event, faction, magic entry or creature. A new empty library receives eight sample entries. **Magic** and **Bestiary** are included as categories alongside the original four.

Each entry has a title, full description, tags, optional image, and optional **Short description** (up to 500 characters). Use one or two sentences for the short description: this appears on encyclopedia cards and in map hover previews. The full description appears when reading the entry or clicking a linked map pin. Older entries work without a short description. Search includes both descriptions, titles, tags and years; History retains its chronological view.

Choose **Manage categories** below the sidebar navigation to add your own category and choose a symbol. The same dialog lets you edit a category's name/icon; renaming updates its entries in the same save. Category definitions are stored in SQLite and included in portable backups. Category deletion is not included in this version. The History timeline currently follows the category named “History”; keep that name to retain its special year controls.

## Geography & Locations

Choose the **Geography** item in the sidebar (or the Locations overview card). This opens a searchable nested location browser and a reading pane. It uses the same encyclopedia entries, image files, SQLite library and backups as the rest of WORLDFORGE. Existing map editing stays in its separate Maps workspace.

Choose **New location**, enter a title and detailed story, and optionally set a type, parent, status, short description or illustration. Locations can also be created through **New entry → Category: Locations**. The existing **Short description** field is the short summary; **Description** holds the full narrative. They are reused rather than duplicated.

Supported types:

- World / Realm; Continent / Region; Ocean / Sea; Island / Archipelago.
- City / Settlement; City District / Neighborhood; Village / Outpost.
- Landmark / Natural Feature; Building / Establishment; Dungeon / Ruin.
- Underwater Location; Route / Sea Passage.

All location-specific fields are optional. Older Locations entries appear as **Unspecified** and can be read without editing or converting them. Use the type filter to find them. Fields are organized into expandable editor sections:

| Section | Fields |
| --- | --- |
| Location basics | Type, parent location and status (inhabited, abandoned, hidden, destroyed, uninhabited or unknown) |
| Life, society & environment | Population, government, linked ruler/steward, controlling faction, climate/environment |
| Inhabitants, points of interest & related lore | Searchable checklists linking existing characters, creatures, places, historical events, factions or other entries |
| Connected places & travel | Connected-location links and travel connections with destination, method, approximate time and notes |
| Dangers, resources & secrets | Hazards, trade goods/resources and undiscovered information |

Population is free text so you can write “about 12,000”, “200 families”, or an unknown estimate. The empty Population field is hidden for seas, routes and natural landmarks; previously entered values remain available. Link pickers accept existing records and show their current titles, so you can use your own categories as well as the standard ones. For a new inhabitant or point of interest, create its encyclopedia entry first and then link it.

Select a place in the hierarchy to read it. Expand/collapse branches with their arrow icons. Search includes location stories, tags, optional details, travel notes and the titles of linked entries. Type filters and search retain matching locations' ancestors for context. Breadcrumbs, **Parent location**, **Within this location** and connected-location links make it easy to move between places. **Add child location** preselects the current place as its parent. The pencil/trash icons at the top of a location detail pane edit or delete it; hover icons for their labels.

Hierarchy and relationship rules:

- A location may have no parent. Parents and travel destinations must be other location entries. Parent chains cannot be circular (checked in the editor, API and backup restore).
- References store entry IDs, not copied titles. Renaming a city, ruler or faction updates link labels and breadcrumbs. Referenced characters and other entries show **Referenced in locations** links back to the places that mention them.
- Deleting a parent asks for confirmation, states the number of direct children, and moves those children to its own parent. If it has no parent, its children become top-level locations. Deeper descendants and their stories are kept; deletion never cascades through a location tree.
- Deleting a referenced entry clears its reference IDs in other locations in the same transaction. A travel connection keeps its written method/time/notes and a **Former destination** label. The confirmation explains that links will be updated. Linked map pins retain their existing standalone-copy behavior.
- Secrets are collapsed in the detail view and excluded from map hover previews. They remain in local data, search results and backups; this is a personal encyclopedia, not a permissions system.
- Location metadata is retained when an existing location's category is renamed or changed, so its hierarchy and lore are preserved. Geography recognizes both the original Locations category and entries with location metadata.

The tree remains beside the reading pane on desktop and stacks above it on small screens. No geographic example hierarchy is added to your world automatically. Start with a single meaningful place and develop its surroundings as needed.

### Geography storage compatibility

This update adds an optional `location` object inside the existing entry JSON payload. It contains type/status, parent and entry reference IDs, optional text fields and travel connections. Image storage is unchanged. **There is no new database, dependency, table migration, or automatic rewrite of older entries.** SQLite schema version 5 remains in use. Existing entries only receive location metadata when saved or when needed to maintain a renamed category.

API/portable-backup format **6** preserves these optional fields and relationships. ZIP backups from formats 3, 4 and 5 and legacy JSON formats 1/2 are still accepted. Imports reject malformed metadata, missing reference targets and parent cycles before replacing records; a rollback ZIP is still made before a valid restore. Reload old tabs and restart the server after updating: older API clients are rejected to prevent them overwriting geography metadata.

Before upgrading, export a backup and keep your existing `data` folder. To undo later edits or a restore, import the portable backup with the current app. To return to the previous app (commit `ee64c71`), stop the server and use a complete pre-update copy of the data folder; the older interface cannot edit geography fields or import format-6 backups. Keep the current folder separately so new lore is not lost.

## Interactive maps

Click **Maps → New map** and enter a title. Description and images are **optional**. An empty map is saved immediately; add artwork later using **Add images**. A map can contain independent PNG, JPEG or WebP canvases, each with its own pins.

The editor fills the browser viewport. Controls use compact square SVG icons; hover or focus one to see its function, and accessible labels are provided for screen readers.

| Control / location | What it does |
| --- | --- |
| Back arrow, top left | Exit the editor and return to your map collection |
| Save / pencil / trash, header | Save explicitly, edit map details, or delete the whole map with confirmation |
| Picture icon, canvas top left | Open/close the image manager; select a thumbnail to switch canvases |
| Map-pin icon, canvas top left | Activate Add pin; click a position on the image |
| Hand icon | Return to browsing; drag the background to pan, or drag a marker to move it |
| List icon | Open/close the pin list and reading panel |
| Magnifiers, right edge | Zoom in/out; mouse-wheel zoom also works |
| Fit / fullscreen icons, right edge | Fit the image or toggle browser fullscreen where supported |
| Upload / replace / trash, bottom right | Add images in a batch, replace the current artwork, or remove its canvas |
| Pencil / arrows in image manager | Rename or reorder the selected canvas |

Removing an image asks for confirmation, including its pin count. The last canvas may also be removed; the empty map remains saved. Removing a canvas deletes its markers, but original image files remain in the managed library and backups. Replacement keeps normalized pin positions; different artwork may require manually repositioning them. Renaming a canvas changes its display name, not its original filename.

When creating or editing a pin:

1. Choose an existing encyclopedia entry using **Find entry** and **Link to entry**, or leave **Standalone pin** selected.
2. Linked pins automatically use the entry's title, short description, full description and image. These fields are read-only in the pin form; use **Open encyclopedia entry → Edit entry** to change the source. Updates appear on linked pins immediately.
3. Choose a marker symbol (person, house, castle, magic, beast, dragon, sword, shield, book, scroll, flag, mountain, tree, skull, gem, potion, portal, sun, moon or generic pin) and a color. New linked markers suggest the category's icon.
4. Save. Hover or focus the marker for a compact title/image/short-description preview; click to read the full story in the tall left-hand panel.

Use the panel's pencil, reposition or trash icons to edit, move or delete a marker. Close the panel with its × button to maximize the canvas. Dragging a marker also moves it. **Cancel tool** keeps its original position. Arrow keys pan a focused canvas; Escape cancels placement and hides the hover preview. Each icon button has a descriptive tooltip.

Deleting an entry keeps its linked markers as standalone pins with copies of its current title, descriptions and image; it does not delete those pins. A backup containing an unavailable entry link displays the saved pin information and an explanation instead of failing to open the map. Linking a different entry refreshes the pin's source information.

Changes save automatically. Pin positions remain normalized fractions between 0 and 1 relative to their own image, so they stay attached while resizing, zooming and switching canvases. Zoom/pan are temporary view settings. Independent canvases are supported; transparent image overlays/layers are not included yet.

## Appearance

The default is **Light**, even when your operating system uses dark mode. Choose **Light**, **Dark**, or **System** in the main top bar or map editor toolbar. Your browser remembers this preference across restarts; System follows operating-system changes. The setting applies throughout the app and never filters or darkens image artwork. Theme preferences are per-browser settings, not part of world backups. The previous forced dark appearance came from unconditional CSS overrides; these now apply only when Dark is selected.

## Images and capacity

Uploaded image bytes are stored as ordinary files, **not base64 in browser storage or database blobs**. SQLite stores a stable image ID, a managed relative filename, MIME type, size, SHA-256 checksum, dimensions, and original filename. The interface uses `/api/images/<id>` URLs, so moving the complete data folder does not break paths.

- PNG, JPEG, WebP and GIF are accepted for entries; map uploads offer PNG, JPEG and WebP.
- Maximum file size: **50 MB per image**, maximum **80 million total pixels** (including animation frames).
- Contents are decoded and validated on the server; filename extensions and browser MIME declarations alone are not trusted. Original bytes are retained. Identical existing image files are reused.
- Capacity depends on available disk space, not the browser's usual 5 MB localStorage quota. Thumbnails/cards load lazily. Large images can still consume significant browser memory when opened.
- Images from cancelled uploads or deleted records are deliberately retained and included in backups. This avoids accidental data loss; an unused-image cleanup/gallery tool is a future improvement. Do not manually rename or edit managed image files.
- Save errors report disk space, permission, offline-server, or conflicting-edit problems. A stale tab cannot overwrite a newer revision. Copy unsaved text and reload when a conflict is reported.

## Portable backups and restore

**Export backup** (the downward-arrow icon in the sidebar) downloads a version-6 ZIP containing `manifest.json` (entries, category definitions, summaries, location fields/hierarchy/lore links, maps, linked pins, migration history and image metadata) and `images/` (all registered image files). It is a complete portable library; it does not require the original computer's paths or a raw SQLite database copy. Image bytes stream from disk, so the browser does not need to assemble the entire library in memory. Verify your browser reports that the download completed, then keep copies on another drive.

To restore on this or a different computer:

1. Start the updated app with `npm start`.
2. Click the upward-arrow **Import backup** icon in the sidebar and select the ZIP. Hovering shows the action name.
3. Confirm replacement. Leave the window open until success appears.

The server stages the upload, rejects unsafe paths, duplicates, missing files, bad checksums, invalid records/pin positions, unsupported versions and unreadable images. It creates a **before-restore ZIP** in `data/backups/`, installs image files under managed names, then replaces entries/maps in a SQLite transaction. A failed validation or save leaves previous records intact. Extra files from an interrupted operation can remain, but are not substituted for your records.

Restores require free disk space for the uploaded ZIP, extracted images, newly installed files, and a rollback backup. ZIP backups use stored image bytes rather than trying to recompress already-compressed images. Backup operations serialize with writes to keep snapshots consistent; a large backup can delay saves.

The default import limit is **1 TB** compressed and expanded, 100,000 image files, and a 64 MB manifest. Set `WORLDFORGE_BACKUP_LIMIT_GB` to adjust the archive size ceiling. Individual image limits still apply. Upload requests allow up to 30 minutes. These are safeguards, not a claim that terabyte libraries have been benchmarked.

Previous version-3, version-4 and version-5 ZIP backups are accepted. Version-3 maps become single-image canvases; formats 3 and 4 receive the standard categories. Exports now use version 6 so location fields, hierarchy and entry references are preserved alongside maps, custom categories, marker symbols and short descriptions. Older app versions cannot import version-6 backups.

Legacy version-1 and version-2 JSON backups are still accepted (up to 64 MB): embedded image data is validated and converted to files. Version-1 imports replace entries and preserve current maps; version-2 imports replace entries and maps. Always export the current world before importing.

## Automatic migration and rollback

### Upgrading existing SQLite maps

Before starting this update, export a portable backup and stop the old server. Keep your existing `data` folder. On first startup, the server makes a consistent SQLite snapshot **before** any schema changes:

- Version 4: `data/backups/before-atlas-<id>.sqlite`.
- Version 3: `data/backups/before-canvases-<id>.sqlite`.

If this snapshot fails, startup stops. A transaction upgrades to schema version 5, preserving entries, image IDs, ordered canvases, pins and their normalized coordinates. A category table is added with the original categories plus Magic and Bestiary. Maps can now have no image. Older pins continue to work with a generic pin symbol; no existing entry needs a short description. Image files are unchanged. Reload older browser tabs: saves from older clients are rejected to protect the new data format.

To roll back, stop the server and preserve the entire current data folder separately. Make another copy for recovery; in that recovery copy only, replace `worldforge.sqlite` with the pre-upgrade snapshot and remove any copied `worldforge.sqlite-wal` and `worldforge.sqlite-shm` files. Keep its `images` folder. For a version-4 snapshot, run the previous multi-image app (commit `89272de`); for version 3, use commit `ab26471`. Set `WORLDFORGE_DATA_DIR` to the recovery copy. The snapshot restores the state from before upgrading; newer edits remain in your preserved current folder. Starting the new app on that copy upgrades it again. A portable ZIP is the preferred way to restore into the current app.

### Migrating older browser-only data

On opening the app, it checks the old `worldforge.entries.v1` localStorage key in that browser. This includes the original array format and the later `{version:2, entries, maps}` format.

Before changing records the server:

1. Saves an exact copy as `data/backups/legacy-original-<checksum>.json`.
2. Creates a ZIP snapshot of the current server library.
3. Validates and converts embedded images into managed files.
4. Merges old entries/maps into SQLite. Conflicting IDs receive new IDs rather than overwriting existing records. Identical records are skipped. A checksum makes repeated migration of the same browser data idempotent.

**The original localStorage value is never deleted or rewritten by the new app.** It remains a fallback. A successful empty migration stays empty; it does not introduce sample entries. Migration failure is shown at the top of the app, with a button to download the original browser data. Correct the file/permission problem and reload, or import a known-good backup. Other browser profiles must be opened individually at their original address or exported/imported separately; the server cannot discover their private localStorage automatically.

To undo a restore, import its `before-restore` ZIP. To undo a migration, import its `before-migration` ZIP. Migration history is retained so the old browser data is not automatically reintroduced after rollback. Original JSON can still be imported deliberately.

To return to the old localStorage-based application, stop this server, preserve the complete data folder and a new ZIP backup, and run the old code (Git commit `0f57701`) at the same browser address/port. It can read the untouched old browser data. **New changes made in the SQLite version do not automatically appear in the old app**, and the old app cannot import version-3 ZIPs. Keep the new data folder for returning to the current version.

## Development and testing

Plain HTML/CSS/JavaScript frontend; Node.js HTTP server with built-in SQLite. No application framework or external database service. The existing UI and pin-coordinate model remain in place.

```sh
npm ci
npx playwright install chromium
npm test
```

The prepared cloud environment uses its installed `/usr/bin/chromium` and does not need a browser download. Tests start isolated servers with temporary data folders; they never reset the working library. `npm test` covers encyclopedia CRUD, image uploads, map/pin interactions, backup compatibility, migration, restart/fresh-browser persistence, fullscreen entry/exit, batch uploads, separate canvas pins, image rename/reorder/replace/remove, themes, schema-3/4 snapshots and upgrades, optional map artwork, custom categories, linked entry previews, source-entry editing/deletion, all twelve location types, optional location metadata, hierarchy/breadcrumbs, cycle and missing-reference rejection, parent/reference deletion, geography search/type filters, geography backup compatibility, desktop/mobile layouts, archive validation, real filesystem permission errors, stale writes, cross-site write rejection, and a 1,000-small-image library. A disk-full UI response is simulated; the tests do not fill the host drive.

Existing runtime dependencies (none added for Geography & Locations):

- `sharp`: inspect and decode image contents safely and enforce pixel limits.
- `archiver`: stream portable ZIP backups from disk, including ZIP64 support.
- `yauzl`: inspect and extract ZIPs entry-by-entry into a controlled staging directory.

Modules: `storage.js` owns SQLite and managed image files; `backups.js` owns migration/archive validation and rollback; `server.js` exposes the local API; `api-client.js` connects the existing `app.js` and `maps.js` editors to it. `geography-model.js` shares location normalization, relationship validation and deletion planning between browser and server. `geography.js` adds the nested browser, location editor fields and detail links. `symbols.js` provides a fixed set of local SVG symbols shared with server validation; no remote icon font is used.

Geography limits: one parent per location; hierarchy depth up to 64 levels; up to 500 links per relationship list and 100 travel connections per place. Travel times are written estimates, not calculated routes. The app still opens one world/library at a time; an in-app world selector and Add world button are a separate follow-up. Separate data folders can already be used with `WORLDFORGE_DATA_DIR` while the server is stopped.

Known limits: testing was on Linux/Chromium, not Windows/macOS or all browsers; 1,000 tiny files and an image over 5 MB were exercised, not thousands of 50 MB maps or power-loss recovery. The UI loads all record metadata and saves a full metadata revision, which is reasonable for a personal library but will benefit from pagination and per-record APIs at much larger scales. No standalone image-library gallery, unused-file cleanup, image overlays/layers, category deletion, or pinch-to-zoom yet. Rich-text formatting and user-uploaded marker symbols are not implemented. Hover previews require a mouse or keyboard focus; click/tap opens the full panel. The local server has no accounts and should not be exposed to a network.
