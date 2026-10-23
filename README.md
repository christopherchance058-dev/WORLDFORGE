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
  worldforge.sqlite       Entries, maps, pins, image metadata, migration history
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

Click **New entry** to create a character, location, historical event, or faction. Entries support descriptions, tags, and an optional image. Click a card to edit or delete it. Search finds titles, descriptions, tags and years. History can be sorted chronologically. A new empty library receives eight sample entries.

Click **Maps → New map**, add a title and optional description, and select one or several PNG, JPEG, or WebP files. The editor fills the browser viewport automatically.

- **Images** opens/collapses the thumbnail panel. Select a thumbnail to switch canvases. Each image has its own pins.
- **Add images** accepts several files at once. Rename images, move them up/down in the list, or replace their artwork using the image panel. Replacement preserves normalized pin positions; different artwork may need manual repositioning.
- **Remove image** asks for confirmation and removes that canvas and its pins. The last image cannot be removed; delete the map instead. Original files remain in the image library and backups.
- **Add pin**: click the image, enter a title/description and choose a color, then save. Click a pin to read, edit or delete it. Drag pins to move them, or choose **Reposition pin** and click a new location.
- Use the mouse wheel or zoom buttons to zoom; drag the background to pan. **Reset view** fits the image. Arrow keys pan a focused canvas; Escape exits a placement tool.
- **Images** and **Pin details** collapse the side panels to maximize space. **Browser fullscreen**, where supported, also hides browser controls.
- Changes save automatically; **Save** explicitly saves the map again. **Edit map** changes its title/description. **Exit editor** returns to the map collection, where the encyclopedia category buttons are available again.

Pin positions remain normalized fractions between 0 and 1 relative to their own image, so they stay attached while resizing and zooming. Zoom/pan are temporary view settings. Independent canvases are supported; transparent image overlays/layers are not included yet.

## Appearance

The default is **Light**, even when your operating system uses dark mode. Choose **Light**, **Dark**, or **System** in the sidebar or editor toolbar. Your browser remembers this preference across restarts; System follows operating-system changes. The setting applies throughout the app and never filters or darkens image artwork. Theme preferences are per-browser settings, not part of world backups. The previous forced dark appearance came from unconditional CSS overrides; these now apply only when Dark is selected.

## Images and capacity

Uploaded image bytes are stored as ordinary files, **not base64 in browser storage or database blobs**. SQLite stores a stable image ID, a managed relative filename, MIME type, size, SHA-256 checksum, dimensions, and original filename. The interface uses `/api/images/<id>` URLs, so moving the complete data folder does not break paths.

- PNG, JPEG, WebP and GIF are accepted for entries; map uploads offer PNG, JPEG and WebP.
- Maximum file size: **50 MB per image**, maximum **80 million total pixels** (including animation frames).
- Contents are decoded and validated on the server; filename extensions and browser MIME declarations alone are not trusted. Original bytes are retained. Identical existing image files are reused.
- Capacity depends on available disk space, not the browser's usual 5 MB localStorage quota. Thumbnails/cards load lazily. Large images can still consume significant browser memory when opened.
- Images from cancelled uploads or deleted records are deliberately retained and included in backups. This avoids accidental data loss; an unused-image cleanup/gallery tool is a future improvement. Do not manually rename or edit managed image files.
- Save errors report disk space, permission, offline-server, or conflicting-edit problems. A stale tab cannot overwrite a newer revision. Copy unsaved text and reload when a conflict is reported.

## Portable backups and restore

**Export backup** downloads a version-4 ZIP containing `manifest.json` (all database records, migration history and image metadata) and `images/` (all registered image files). It is a complete portable library; it does not require the original computer's paths or a raw SQLite database copy. Image bytes stream from disk, so the browser does not need to assemble the entire library in memory. Verify your browser reports that the download completed, then keep copies on another drive.

To restore on this or a different computer:

1. Start the updated app with `npm start`.
2. Click **Import backup** and select the ZIP.
3. Confirm replacement. Leave the window open until success appears.

The server stages the upload, rejects unsafe paths, duplicates, missing files, bad checksums, invalid records/pin positions, unsupported versions and unreadable images. It creates a **before-restore ZIP** in `data/backups/`, installs image files under managed names, then replaces entries/maps in a SQLite transaction. A failed validation or save leaves previous records intact. Extra files from an interrupted operation can remain, but are not substituted for your records.

Restores require free disk space for the uploaded ZIP, extracted images, newly installed files, and a rollback backup. ZIP backups use stored image bytes rather than trying to recompress already-compressed images. Backup operations serialize with writes to keep snapshots consistent; a large backup can delay saves.

The default import limit is **1 TB** compressed and expanded, 100,000 image files, and a 64 MB manifest. Set `WORLDFORGE_BACKUP_LIMIT_GB` to adjust the archive size ceiling. Individual image limits still apply. Upload requests allow up to 30 minutes. These are safeguards, not a claim that terabyte libraries have been benchmarked.

Previous version-3 ZIP backups are accepted and their maps become single-image canvases. Older app versions cannot import version-4 backups.

Legacy version-1 and version-2 JSON backups are still accepted (up to 64 MB): embedded image data is validated and converted to files. Version-1 imports replace entries and preserve current maps; version-2 imports replace entries and maps. Always export the current world before importing.

## Automatic migration and rollback

### Upgrading existing SQLite maps

Before starting this update, export a portable backup and stop the old server. Keep your existing `data` folder. On first startup, schema version 3 is copied to `data/backups/before-canvases-<id>.sqlite` using SQLite's consistent snapshot operation **before** any schema changes. If that backup fails, startup stops. A transaction then upgrades to schema version 4: every existing map becomes a container with one “Original image” canvas, preserving image IDs, pins, normalized coordinates and entries. Image files are unchanged. Reload any older browser tabs; their saves are rejected to prevent overwriting the new format.

To roll back this schema upgrade, stop the server and preserve the entire current data folder separately. Make another copy for recovery; in that recovery copy only, replace `worldforge.sqlite` with the `before-canvases` snapshot and remove any copied `worldforge.sqlite-wal` and `worldforge.sqlite-shm` files. Keep its `images` folder. Run the previous SQLite app (commit `ab26471`) with `WORLDFORGE_DATA_DIR` pointing to this recovery copy. The snapshot restores the state from before upgrading; newer edits remain in your preserved current folder. Starting the new app on the recovery copy would upgrade it again. A portable ZIP is the preferred way to restore into the current app.

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

The prepared cloud environment uses its installed `/usr/bin/chromium` and does not need a browser download. Tests start isolated servers with temporary data folders; they never reset the working library. `npm test` covers encyclopedia CRUD, image uploads, map/pin interactions, backup compatibility, migration, restart/fresh-browser persistence, fullscreen entry/exit, batch uploads, separate canvas pins, image rename/reorder/replace/remove, themes, schema-3 snapshots and upgrades, archive validation, real filesystem permission errors, stale writes, cross-site write rejection, and a 1,000-small-image library. A disk-full UI response is simulated; the tests do not fill the host drive.

Existing runtime dependencies (none added for the fullscreen/multi-image update):

- `sharp`: inspect and decode image contents safely and enforce pixel limits.
- `archiver`: stream portable ZIP backups from disk, including ZIP64 support.
- `yauzl`: inspect and extract ZIPs entry-by-entry into a controlled staging directory.

Modules: `storage.js` owns SQLite and managed image files; `backups.js` owns migration/archive validation and rollback; `server.js` exposes the local API; `api-client.js` connects the existing `app.js` and `maps.js` editors to it.

Known limits: testing was on Linux/Chromium, not Windows/macOS or all browsers; 1,000 tiny files and an image over 5 MB were exercised, not thousands of 50 MB maps or power-loss recovery. The UI loads all record metadata and saves a full metadata revision, which is reasonable for a personal library but will benefit from pagination and per-record APIs at much larger scales. No standalone image-library gallery, unused-file cleanup, image overlays/layers, or pinch-to-zoom yet. The local server has no accounts and should not be exposed to a network.
