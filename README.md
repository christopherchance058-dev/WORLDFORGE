# WORLDFORGE

A personal worldbuilding notebook for your characters, places, creatures, magic, and stories. It runs in your browser and saves your world on your computer.

No account, subscription, or paid service is needed.

## What you can do

- Create, edit, and search your worldbuilding entries.
- Keep separate worlds and switch between them.
- Organize entries into your own categories.
- Connect places, people, factions, and historical events.
- Upload maps and add pins linked to your entries.
- Add pictures and switch between light and dark appearances.
- Export a backup of your world.

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

## Start building your world

Choose **Characters** to browse your cast or create someone new—even with nothing filled in yet. Add a portrait and expand the optional sections whenever you are ready. Character type and life status accept your own words; saved character details are offered as suggestions while typing. Use the **Card size** slider to fit more characters on screen.

Choose **New entry** to begin writing, **Location** to organize places, or **Maps** to upload your artwork and place pins.

The large banner shows your current world. Use its **pencil** to change the name, description, or banner image. For artwork, **2400 × 800 pixels** works well; keep important details near the centre because the edges may be cropped. Use the **two-arrow button beside the pencil** to switch worlds, or use the **plus** in that window to create another world. New worlds start empty; your existing work stays in the first world.

To remove a world, click the **trash can at the banner’s top right** and confirm. The app checks a complete backup first and keeps the original files. To undo, open the world switcher, expand **Deleted worlds**, and choose **Restore**. Moving a world to Trash does not free disk space.

Use the **plus beside Categories** to add categories or change their link colors. Choose a new category’s name and icon when creating it; afterward they are fixed. Choose from 32 preset colors, pick a custom color, or reset to the default. The world banner and world controls appear only on **All entries**. Hover over an icon to see what it does. Your saved work remains available after closing and reopening the app.

In a location’s reading window, **Add child location** lets you create a new place or choose an existing location. Choosing an existing place keeps its content and children. If it already belongs to another parent, the app asks you to confirm the move. Locations that would create circular nesting are excluded.

## Back up your world

A backup is a spare copy of the **world currently selected**, including its banner image, entries, categories, pictures, maps, and pins. If you have several worlds, export a backup for each one.

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
