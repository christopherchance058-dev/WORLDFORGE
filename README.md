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
