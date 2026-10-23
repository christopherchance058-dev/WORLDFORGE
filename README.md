# WORLDFORGE

Your personal worldbuilding encyclopedia. No accounts, paid services, or API keys.

## Open the app on your computer

1. Download this project folder to your computer and unzip it if needed.
2. Install the free LTS version of Node.js from nodejs.org.
3. Open a terminal in the WORLDFORGE folder (on Windows, open the folder, type `cmd` in the File Explorer address bar, and press Enter).
4. Type `npm start` and press Enter.
5. Type `http://localhost:3000` into your browser's address bar.

Eight sample entries appear automatically. Leave the terminal open while using the app. Use the same browser and address each time so your saved world is available.

You can also try double-clicking `index.html`, but browser support for saving directly opened files varies. The cloud browser blocks file URLs, so that opening method could not be validated here. The local-server method above was tested.

## Use WORLDFORGE

- Click **New entry**. Enter a title, category, description, and optional tags and image. Click **Save entry**.
- Click any entry card to read it. Use **Edit entry** to make changes, or **Delete entry** to remove it after confirmation.
- Use the left sidebar to browse Characters, Locations, History, and Factions.
- Search finds titles, descriptions, tags, and years. Clear the search to see everything again.
- History entries can have a year, including negative years. History opens sorted from earliest to latest, with undated entries last.
- Images are saved with your entries. Use images under 2 MB; small images leave more space for stories.
- Click **Export backup** to download a JSON file containing all entries and images. Keep copies outside your browser, especially before clearing browser data.
- **Import backup** restores an exported JSON file. It replaces the current encyclopedia after confirmation; export the current one first if you want to keep both.

Your data stays in this browser on this device. It does not automatically sync to other browsers or devices. Private/incognito windows can erase data when closed. Clearing browser data removes your encyclopedia. Export/import lets you move it to another computer. Browser storage is limited; a failed save displays an error and keeps the editor open.

## Run with a stable local address (recommended for regular use)

Install the free LTS version of Node.js from nodejs.org. Open a terminal in the project folder and enter:

```sh
npm start
```

Then type `http://localhost:3000` in your browser's address bar. Leave the terminal open while using the app. To stop it, press Ctrl+C. Run the same command whenever you want to reopen the app. No dependency installation is needed to run it.

The server started in the cloud workspace is on that machine, not on your personal computer. To use it locally, download the project and follow the steps above. This first version is not a public website.

## Development and tests

Plain HTML, CSS, and JavaScript; a tiny Node.js static server. There is no database or build step. Playwright is used only for automated testing.

```sh
npm ci
npx playwright install chromium
npm test
```

On the prepared cloud environment, tests use the existing `/usr/bin/chromium`, so no browser download is needed. The tests cover sample content, search, category filters, timeline order, create/edit/delete, image uploads, reload persistence, backup round trips, invalid imports, safe text rendering, storage errors, and desktop/mobile layout.

Files: `index.html` (page), `styles.css` (appearance), `app.js` (entries and storage), `server.js` (local server), and `tests/app.spec.js` (browser tests).

The optional direct-file test is disabled by default because the managed cloud browser blocks file URLs. On an unrestricted personal browser installation, set `WORLDFORGE_TEST_FILE=1` to run it. All normal application tests use the local server.

## Interactive Maps

Click **Maps** in the sidebar, then **New map**. Enter a title, optional description, and choose a PNG, JPEG, or WebP image from your computer. Click **Save map**. Map images must be at most 2 MB and 40 million pixels. No image is sent to a server.

- **Add pin** activates placement mode. Click a location on the image, enter a title, optional description, and color, then **Save pin**.
- Click a pin to read it in the side panel. **Edit pin** changes its details. **Reposition pin** lets you click a new location. **Cancel tool** leaves its original location intact. Clicking an existing pin always opens it, even while placing pins.
- Use the wheel or **Zoom in / Zoom out** to zoom. Drag the map to pan in normal browsing mode. **Reset view** restores the initial view. Focus the canvas and use arrow keys to pan or Escape to leave a placement tool.
- **Edit map** renames the map or updates its description. **Delete map** removes it and all its pins after confirmation.
- **All maps** returns to your collection. The encyclopedia categories in the sidebar return to your entries. Saving a map or pin is immediate when its Save button succeeds.

Maps, images, and pins survive refreshing or restarting the local server. Use the same browser profile and server address/port each time. **Export backup** now includes every map image and pin along with all encyclopedia entries.

### Storage and compatibility

This version keeps localStorage and its existing key, `worldforge.entries.v1`. Old array-only entry data is read without alteration. The next successful save writes `{version: 2, entries, maps}` to that same key in a single atomic operation. If the browser rejects the save, the previous stored document remains intact, and the editor reports the failure. No separate migration or deletion is required.

Backups exported by this version use `format: "worldforge", version: 2` with `entries` and `maps`. Version-1 backups remain supported: importing one replaces entries after confirmation and **preserves existing maps**. Version-2 imports replace both entries and maps after confirmation. Invalid maps, duplicate IDs, non-finite/out-of-range coordinates, unsupported versions, and unreadable map images are rejected before changing storage. Keep your pre-upgrade backups; older app versions cannot read the new storage document or version-2 backups. Avoid running old and new app versions against the same browser storage.

localStorage typically permits around 5 MB per site. Base64-encoded images take more space than their source files, and entries share the same quota. The 2 MB upload limit does not guarantee space for every image. Use smaller images, export backups, and delete unwanted content if storage fills. Private browsing or clearing browser data may erase everything. Images are not automatically compressed. Backups are limited to 15 MB on import. View zoom and pan reset when a map opens; pin positions persist as normalized x/y fractions from 0 to 1 and remain attached through zoom and resizing.

For larger atlases, the next step is IndexedDB for image blobs. A future migration should copy and validate existing localStorage data in a transaction, keep the original until verification succeeds, and continue accepting version-1/version-2 backups. This release does not change storage engines.

### Maps implementation and validation

`maps.js` provides the collection, editors, pin rendering, normalized-coordinate placement, image validation, and zoom/pan. `app.js` owns shared persistence and backup compatibility. `index.html` loads the module and supplies the map section; `server.js` serves it; `styles.css` adds the map layout and shared dark palette. No dependencies were added.

`npm test` runs the existing encyclopedia tests and map tests in `tests/maps.spec.js`. The latter cover map/pin creation, edits, deletion confirmation, image upload, coordinate alignment after resize/zoom/pan, placement while zoomed, reload and server-restart persistence, map backup round trips, legacy entry migration, legacy backup preservation, invalid image/coordinate rejection, and quota failure. The optional direct-file test remains skipped in the managed cloud browser.

Current limits: one background per map (image replacement is not yet offered), simple colored pins, no layers or links to encyclopedia entries, and no multi-user editing. Use toolbar zoom on touch screens; pinch-to-zoom is not implemented.
