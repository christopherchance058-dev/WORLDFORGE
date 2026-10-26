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

## Historical events

History entries keep the normal title, short description, description, image, and tags. Open **Chronology** for optional Start year, End year, Year precision, Date certainty, and Calendar or dating system. Use whole fictional years, including negative years. A blank year remains unknown; zero is stored only when you explicitly enter it. Leave End year blank if it is unknown or not recorded—this does not imply the event ended in its start year.

Choose **Unknown** certainty to save without dates. The editor disables the year inputs; switching back before saving restores what you typed. Unknown saves no start/end year. Confirmed, Approximate, Disputed, or Not specified can be used with incomplete dates. End year cannot precede Start year. **Historical classification** suggests event types and accepts your own wording. Calendar names are labels; no conversion is performed. Year sorting groups calendar names alphabetically (unnamed first), orders events within each calendar by start year, and places undated events last.

Existing events retain their old year and other content. Editing chronology synchronizes that legacy year with the start year. Use the current app for chronology edits and portable backups; older versions cannot reliably edit the new date details. Open **Timeline** under Atlas to explore these events on a horizontal axis.

## Visual history timeline

Under **Atlas**, choose **Timeline**. The ruler positions events by numeric start year; a bar appears only when both start and end are recorded. Dashed outlines mean Approximate and dotted outlines mean Disputed; labels also show certainty. Negative years and explicitly entered Year 0 follow the same numeric scale.

Drag blank space or use the earlier/later arrows to move through time. Use **+ / −**, **Fit**, or **Jump to…** to find a useful period. Ctrl + wheel (Meta + wheel where supported) zooms around the pointer. Shift + wheel pans horizontally. With the timeline background focused, Left/Right pans, +/− zooms, Home fits, and Page Up/Down scrolls through overlapping event rows. Zooming never introduces month/day precision. Choose **History** in the sidebar to return to the normal cards.

Click an event title or duration bar to open its existing reading window; use the normal pencil to edit. Save or delete updates the timeline without reloading. **New event** uses the same History editor. Search can find a particular event in a dense history; use Fit after searching to see the matching period. Ordinary Back/Forward restores the timeline's view.

Entries without a start year are under **Undated events**, never placed at Year 0. **Other calendars** contains entries using a different calendar/unit from the selected ruler. Choose their Timeline scale to plot comparable numeric positions; no conversion is assumed. Open either section to browse entries, with Show more for longer lists. Fit uses compatible dated events and shown era boundaries. If imported chronology cannot be plotted safely, **Chronology to review** keeps the affected entries accessible. There is one global timeline for each selected world. View settings are temporary; switching worlds or restoring a backup resets them.

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

### History timeline filters and connected entries

Open **Atlas → Timeline**. Use **Filter event type** and **Filter date certainty** alongside search; all active choices must match. Custom saved event types appear automatically. “No event type” and “Certainty not specified” cover blank values; Unknown certainty is a separate saved value. Undated and named-calendar results remain in their own sections below the axis. Filtering never edits dates or records.

Search/filter changes retain your year and zoom and start at the first event row. Use **Fit** to frame the matching numeric dates, or **Clear filters** (shown only while filtering) to restore all results. An empty result offers recovery controls. Back/Forward restores these session choices; reload/world switching resets the timeline session.

In a History editor, expand **Connected history**. Search/select existing Characters, Factions and Locations; multiple selections are allowed. Selected badges can be removed independently. Optional unlinked notes never create entries and intentionally do not parse @ links. These neutral associations do not assert participation, combat or a single setting. Save, open the event and click its related entries to read them; referenced entries also show **Referenced in history**. Back returns through the existing reading/timeline context. A small linked count on timeline cards points to this details workflow.

To check persistence, add a selection, save, reopen and reload, then export/import a ZIP in an isolated test world. Remove a selection and confirm its entity still exists. Deleting an event keeps its related entities; deleting an entity cleans only its structured links. Missing references in older/imported records appear as unavailable and remain removable. Existing descriptions, images, tags and chronology remain in the event. Use the current app for editing these optional relationship fields; older versions cannot reliably edit them.

History chronology also accepts **Time unit** (e.g. Tide, Cycle or your wording), **Written start/end date**, and editable **Date certainty** with optional suggestions. Leave numeric positions blank when a date cannot be placed on a ruler. Unknown certainty clears numeric dates, retaining written dates. Whole-number positions still support zero/negative values within the existing range.

In the visual timeline, choose **Timeline scale** to view a saved calendar/unit pair. Each scale has its own ruler: Tide 3 is never automatically treated as Year 3. Other scales remain accessible in the separate list. Search, filters, Go to position, Fit, reading links and Back/Forward work with the chosen scale. Written dates appear in reading views and event labels; a written date by itself is never guessed onto the ruler. Creative suggestions remain editable; timeline/filter selectors choose existing saved values.

Use this updated app when editing custom chronology: older releases can reject custom certainty wording or mislabel numeric positions as years. Current ZIP backups retain all these optional fields.

### Historical eras

Open **History → Eras**. Choose **New era**, enter a name, and optionally add dates, a description (including @ links), a display color, certainty, a square card image and a separate wide timeline banner. Eras are separate from events and can overlap. Select a band label or an era card to read/edit/delete it. Deleting an era keeps every event; deleting an event keeps every era. Unsaved era edits prompt before closing.

Bands align with the chosen Timeline scale. Their labels have separate scrollable rows when they overlap; event cards remain readable below them. Search and certainty filter eras as well as events; event type applies only to events. The **Eras** selector chooses Illustrated, Compact or Hidden bands. **Fit** fits matching events and shown eras. Missing numeric starts remain in **Unpositioned eras**; a known start without an end is a boundary marker, with no invented duration. Different calendars/units never get converted automatically.

**History → World chronology** optionally sets a name, calendar and unit for the world's initial scale. Existing worlds default to Year without configuration. This setting changes the initial ruler, not saved dates; Back/Forward retains your chosen scale and view.

To verify the feature, create overlapping periods, pan/zoom, hide/show bands, open an era and a linked entry then navigate Back. Edit/save/reload and export a current ZIP; imports include eras/settings and create a rollback. Old ZIPs/legacy JSON have no eras and restore the default chronology, so keep a current backup before replacing your library. Older application versions cannot manage/export these new records reliably.

History has **Events** and **Eras** tabs sharing the normal card browser. Eras also appear in All entries. Choose either tab to search, sort and create that kind of record; a single History sidebar item holds both. The visual timeline’s **＋ New** menu offers Event and Era creation. Its movement bar sits directly above the ruler; **Jump to…** reveals a numeric input (Enter submits), and **?** reveals keyboard and filtering help. These disclosures also close with Escape or a click outside.

Era **Card image** recommends 1024 × 1024 px (1:1); **Timeline banner** recommends 2400 × 800 px (3:1). Upload, replace, remove and view each independently. Other dimensions are accepted, previews crop only for display and original files remain unchanged. Current ZIPs include both images, including when restoring into another world. **Era band display → Illustrated / Compact** controls visual density. A missing end position still shows only a boundary marker, without inventing a banner duration.

Timeline event cards now show names/dates and useful indicators rather than description snippets. Predefined event types get icons; custom or unspecified types have none. Click to read the full event. In any existing @-enabled field, find eras labelled **History · Era** and select them like other entries. Links follow renames and open the era reading view; deleted eras leave unavailable references without deleting surrounding prose. Use the current app for era references/images because older versions cannot reliably edit or restore them.

Timeline is an Atlas workspace beside Maps. History retains Events/Eras cards and World chronology settings. Event and era reading windows offer **Show on timeline**: it selects the record’s calendar/unit, clears search/type/certainty filters and focuses its numeric position (including overlap rows). Undated records open their expanded list without an invented date. Era targets enable bands if hidden. Back/Forward restores the prior reading and browsing context. The same records, artwork, links and backups serve both views.

Creatures supports fauna, flora, fungi, spirits and other beings through one shared form. Everything is optional; blank names save as “Unnamed creature”. Expand sections for classification, appearance, habitat, behavior, life cycle, abilities and significance. Narrative fields support @ links; classification accepts your own text. Existing Bestiary entries appear as Creatures with their content and links preserved. Worlds containing both category names keep them separate and show a notice. Use current-version backups when moving these optional details between libraries.

In a Creature editor, expand **Relationships & linked lore** to select entries and optionally add a relationship type, notes or shared history. Referenced entries show **Connected creatures**; deleting a target preserves its former name and written lore. **Other appearances & images** accepts multiple images with optional @-linked captions and full-original links. These sections are optional and describe lore; they do not generate ecosystem diagrams.
