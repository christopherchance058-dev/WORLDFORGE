# WORLDFORGE

A personal notebook and atlas for the worlds you imagine. Bring your characters, places, creatures, magic and history together in one connected library.

WORLDFORGE runs in your browser and saves your work on your computer. No account, subscription or paid service is needed.

## Build your world

- **Characters:** develop their identity, appearance, personality, background, goals and relationships.
- **Creatures:** describe animals, plants, fungi, spirits and other beings, including their habitats, abilities and place in your world.
- **Locations:** build places within places, from a whole continent to a small settlement, with inhabitants and connections to other locations.
- **Factions:** develop groups, their leaders, members, territories, beliefs, allies and rivals.
- **Magic:** describe spells, powers and entire magic systems, including their sources, effects, limits, risks, teachers and users.
- **History and eras:** record events and overlapping ages using your world's own calendars, dates and time units. Explore them together on a visual timeline.

## Connect your lore

Any entry can connect to entries in any category or to historical eras. Common relationship questions are included, with extra suggestions and custom connection fields for your own ideas. Leave questions unanswered whenever you like.

Link entries and eras directly in your writing with **@**. Reading views bring connections and references together, making it easy to follow one piece of lore to another. Characters and creatures can belong to several eras, with era banners shown alongside their story.

## Explore your maps

Upload maps and place pins linked to your entries. A map can contain several images, with its own pins on each. Browse your lore alongside the map, zoom in, or open it fullscreen.

## Keep everything organized

Create separate worlds, choose your own categories, and organize entries with folders and tags. Search your library, adjust card sizes, and move back and forth between the entries you have visited. Deleted worlds can be recovered from Trash.

## Make it yours

Add portraits, illustrations, world banners and extra appearance images for characters and creatures. Original image files are preserved. Choose category link colors and a light or dark theme.

Collapsible editor sections keep longer entries manageable. Read your finished entries in a consistent layout, with connected lore close at hand.

## First-time setup

1. Install **Node.js 24 or newer** from [nodejs.org](https://nodejs.org/). Choose the **LTS** download.
2. [Download WORLDFORGE](https://github.com/christopherchance058-dev/WORLDFORGE/archive/refs/heads/main.zip) and extract the ZIP file.
3. Open the extracted WORLDFORGE folder, then open a terminal there:
   - **Windows:** click the folder’s address bar, type `cmd`, and press Enter.
   - **Mac:** right-click the folder and choose **Services → New Terminal at Folder**.
   - **Linux:** right-click inside the folder and choose **Open in Terminal**.
4. Enter these commands one at a time:

   ```sh
   npm ci
   npm start
   ```

   The first command installs what the app needs. It requires an internet connection.

5. Open **http://localhost:3000** in your browser.

Keep the terminal window open while using WORLDFORGE. Sample entries are included so you can explore immediately.

## Opening it again

Open a terminal in the WORLDFORGE folder and enter:

```sh
npm start
```

Then open **http://localhost:3000** in your browser. You only need to run `npm ci` during setup or when an update requires it.

To stop the app, click the terminal window and press **Ctrl+C**. Wait until it stops before closing the terminal.

## Back up your world

A backup is a spare copy of the **world currently selected**, including its banner image, entries, historical eras, chronology settings, categories, pictures, maps, and pins. If you have several worlds, export a backup for each one.

1. Open WORLDFORGE and check that your world is there.
2. Click the **downward-arrow icon** in the sidebar. Hover over it to see **Export backup**.
3. Wait for the ZIP file to finish downloading. Check your browser’s Downloads list if you cannot find it.
4. Keep that ZIP somewhere safe, preferably on a USB drive or another drive. You do not need to unzip it.

Make a new backup after important writing sessions and before updating the app. Keep a few older backups too.

## Restore a backup

Restoring brings back the world saved in a backup. **It replaces the contents of the world currently open in the app.** Other worlds stay untouched, and the open world keeps its current name and description. Switch to the right world—or create an empty one—before importing. Export that world first if you want to keep its contents.

1. Open WORLDFORGE.
2. Click the **upward-arrow icon** in the sidebar, labelled **Import backup** when hovered.
3. Select your backup ZIP and confirm the import.
4. Leave the app open until it says the backup was imported successfully.
5. Check a few entries, pictures, and maps before deleting any old copies.

## Move your world to another computer

This is what “migrating your data” means: moving your saved world to a new home.

1. On your old computer, make a backup using **Export backup**. Repeat for each world you want to move.
2. Copy the finished backup ZIP to a USB drive or transfer it to the new computer.
3. Set up WORLDFORGE on the new computer using the first-time instructions above.
4. Open the app there and use **Import backup** to select your ZIP. For more worlds, create an empty world with the name and description you want, then import its matching ZIP.
5. Check that your entries, pictures, and maps are present. Keep the old copy and backup until you are sure everything is there.

## Update the app without losing your world

All your worlds are stored in the **`data` folder** inside your WORLDFORGE folder. Keep it when updating.

1. Export a backup, then stop the app with **Ctrl+C** in its terminal.
2. Download and extract the new version into a separate folder.
3. **Before starting the new copy**, copy the entire `data` folder from the old WORLDFORGE folder into the new one. Do not copy only some of its files.
4. Follow the setup commands in the new folder, then open the app and check your world.

You can also set up a fresh copy and **Import backup** instead of copying the `data` folder. Keep your old folder and backup until the updated app opens your world correctly.
