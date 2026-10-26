# WORLDFORGE development rules

These are the default instructions for future coding tasks in this repository. Use [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for the compact architecture map and README for detailed operation/recovery instructions. Explicit user instructions take precedence.

## Start focused

1. Read this file and PROJECT_CONTEXT.md at the start of a new task.
2. Check `git status --short`; inspect relevant existing diffs before editing. Preserve uncommitted user work. Never discard it or use destructive Git cleanup/reset operations.
3. Identify the requested behavior and read only the affected files and necessary dependencies using the context's source map. Do not re-read/re-analyze the entire app on every feature or repeat explanations already established and still accurate.
4. Expand inspection when evidence demands it: uncertain integration, contradictory documentation, correctness, data safety, or architectural changes. Documentation guides inspection; it does not replace checking the code being changed.

## Implement the smallest complete change

- Work on one clearly defined feature/subtask at a time; divide larger work into manageable steps.
- Complete the requested behavior in the existing app. Reuse existing components, conventions, models and integrations. Do not replace working functionality merely because another implementation is possible.
- Avoid unrelated refactoring, cosmetic edits outside scope, speculative abstractions and changes to existing interfaces/behavior/storage formats that the feature does not require.
- Prefer the existing stack/dependencies and preserve local-first operation. Add no library, cloud service, external API, database, account requirement or build system unless genuinely needed and the user has authorized the design.
- The user has no programming knowledge: edit/run/verify the project yourself when the environment supports it; do not hand back coding or terminal work that you can perform. Do not invent lore or completed features.
- Keep user-generated content safely rendered. Preserve normalized map coordinates, ID-based relationships and existing record fields where relevant; examine necessary integration points, not just the visible widget.
- Reuse `Navigation.visit` for new entry/workspace opening paths and provide state/restore hooks where appropriate. Keep saves and view refreshes out of navigation history, and reuse the shared editor discard guard before leaving unsaved work.

## Universal @ linking

- Internal linking is a core capability. Whenever introducing a category, entry type, or text field, evaluate and integrate the existing shared `@` system into every appropriate narrative or short-text field. Preserve compact editing, validation and field limits; do not force linking into dates, numbers, dropdowns, checkboxes or image uploads.
- Reuse `description-links.js`: shared autocomplete, stable-ID references, chip editing, safe DOM rendering and existing clickable-entry navigation. Do not create a separate linking implementation unless a technical reason is documented.
- Document any field that cannot support linking and why. Distinguish required future integration from implemented coverage; claim support only after that field/category is implemented and tested.
- Add focused tests for new linkable fields/categories: insertion, saving/reopening, readable current names after renaming, missing/deleted targets and preservation of surrounding text. Check affected existing categories when changing shared linking infrastructure, including persistence/backup compatibility where relevant.
- Prioritize desktop behavior. Do not add mobile-specific implementation, screenshots or keyboard/IME testing unless explicitly requested; existing general regression checks remain subject to risk-based testing below.

## Universal flexible connections and unified reading UI

- Connection fields are optional named pickers in the existing Faction Allies/Rivals style: selected chips, searchable existing targets and neutral unlinked notes. Offer category-appropriate suggestions through a collapsed suggestion menu plus an Add custom connection field action; never create suggested fields automatically or make them required. Reuse existing specialist fields instead of duplicating them. Keep optional field naming/@-linked notes/shared history in a disclosure, and allow entry-local custom field renaming/removal without deleting target entries. Future/custom categories inherit this same UI and open wording.
- Redundant catch-all controls such as Related lore must not compete with custom fields. Preserve their stored selections/notes as an editable Other connections draft field; move them to the existing generic connection JSON only on explicit successful save. Cancel/failure/startup must not migrate or lose content. Existing specialist geographic and relationship safeguards remain intact.

- Every existing and future encyclopedia category, including custom categories, must inherit the shared Connections editor and one **Connections & linked lore** reading section. Reuse `connection-model.js` and `connections.js`; do not create a category-specific editor, backlink heading or separate visual language. All rows use EntryProfile's horizontal neutral label badge / colored target-chip layout with identical typography and spacing. Existing specialist relationship arrays and structured facts remain compatible and feed the shared reader without duplicate presentation.
- Connections are optional and may target any entry category or a typed era, with multiple stable target IDs, free relationship wording/suggestions, neutral unlinked notes and optional @-linked notes/shared history. Keep structural location-parent, birthplace, travel and other specialist safeguards; generic connections provide unrestricted lore associations without weakening geographic semantics.
- Outgoing and incoming connections must identify their provenance; never infer reciprocal facts, membership, magic rules, ecological edges or dates. Incoming narrative @ mentions are distinct from explicit relationships and belong to their own selectable filter. Reuse bounded lists/search, shared navigation/category colors, draft guards, nested reference validation, deletion-safe former names, search and backups.
- Characters and Creatures may manually select multiple **Eras lived through**. Selection and banners are optional; use the saved era timeline artwork and live names, preserve originals, show safe missing-era fallbacks, and never infer lifespan/calendar conversion or rewrite dates. Future categories inherit universal connections; add era-lifespan presentation only where the category's subject warrants it.
- New specialized structured relationships must join the central reading adapter rather than append separate “Connected X” headings. Preserve all legacy fields/IDs/content. Test insertion/save/reopen, typed entry/era ID collisions, renames/deletions, incoming direction, @ ownership, notes, draft failures and backup/restart compatibility using isolated libraries.

## Open worldbuilding vocabulary

- Default creative classifications and descriptive choices to editable text with optional suggestions, including future categories and editors. Do not restrict the user's fantasy vocabulary to a fixed whitelist. Chronology must support custom time-unit names and written dates; never assume every world measures time in years. Keep optional numeric coordinates for reliable plotting and keep different units/calendars separate unless the user defines their correspondence. Structural navigation/filter controls, valid entry IDs, image safeguards and numeric calculations may remain constrained where needed for correctness; do not turn those safeguards into creative-content restrictions. Record real exceptions explicitly.

## Category rules

- Show the world banner only on All entries. All existing and future categories allow an initial name and icon at creation; afterward, expose only color editing. Preserve saved names/icons and relationships. Reuse the shared expanded preset palette, custom color picker and default reset, with readable link shades in Light and Dark themes.

- Standard category browsers, including Characters and future categories, reuse the common heading, search/size/create/sort toolbar and section count styling. Keep specialist filters/fields. Use a distinct workspace only when functionality needs it (Location hierarchy, Maps).

- All editor errors belong directly beneath the heading and must scroll into view, including validation, field limits, uploads and save failures. Reuse the shared form-error presentation policy; future editor dialogs must expose a `.form-error` summary. Preserve drafts when errors occur. Locations require only a nonblank name; optional supplied values still obey length, relationship, nesting and image validation.

## Shared entry presentation

- Reuse `entry-profile.js` (`EntryProfile.header`, `section`, `facts`, `field`) and shared profile/editor styles for current and future categories. Keep category-specific fields and validation without creating a different header, heading scale, image layout or action pattern for each category. Cards continue to use `EntryCards`: square thumbnail beside title and tags at every size, with full-width preview below. Cards show no category/year/species/occupation/status/location-type metadata rows; keep those details in saved entries and reading windows. Keep natural card heights. Reuse this format for all future category cards.
- Recommend 1024 × 1024 px (1:1) for entry portraits, emblems, illustrations and gallery previews. Square framing is display-only: accept other dimensions, preserve original files and provide full-image links. Maps retain their natural aspect ratio; world banners retain their 2400 × 800 px (3:1) guidance. Do not resize/crop stored files to enforce a preview shape.
- Saved entries open through the shared reading dialog over the existing workspace. Reuse its icon actions, readable tags and aligned label/value rows; hide empty optional fields and preserve original images, links and browsing context. Shared editor keyboard handling belongs in `editor-keys.js`: Enter advances through visible text fields, Shift+Enter adds multiline breaks, and autocomplete selection takes priority. Q/E must never navigate while a text control has focus; leaving dirty editors reuses the discard guard.
- Category colors belong only to clickable entry references, never ordinary labels/headings. Reuse `CategoryColors.apply(element, targetEntry)` for both @ references and structured links so the destination category determines the theme-readable shade. New categories get shared defaults and the existing color setting; preserve optional category color metadata through renaming, saves and backups, with focused tests. Keep reading-field badges neutral and text-width through `EntryProfile.field`.
- Category editors must keep descriptive classifications open to custom text and suggestions. Optional relationships reuse `Geography.flexiblePicker` for multiple stable-ID selections plus explicit, neutral unlinked notes; never auto-create entries or auto-link names. Keep structural category/parent/travel, numeric/date and image safeguards. Document real exceptions, preserve old singular links when extending models, and test notes, backlinks, deletion and backups. Unlinked selection labels are intentionally plain (no @ parsing); narrative fields retain shared @ linking.
- For shared presentation changes, check populated and sparse Character, Faction and Location views/editors in Light and Dark themes, including linked text and image bounds. Follow the existing risk-based testing and desktop-priority rules.

- History exposes Events/Eras tabs under one sidebar item; eras use shared cards and typed @ links without becoming ordinary entries or a separate category. Keep card images and timeline banners independent, include both in image validation/backups/restore remapping, and preserve original files. Timeline events omit descriptions and use icons only for predefined types; empty/custom types have none.

- History’s visual timeline is a functional exception to ordinary category cards: show numeric chronology/type/certainty in its anchored cards and retain the standard metadata-free format elsewhere. Derive event and era positions from HistoryModel; keep unpositioned or incompatible calendar/unit records off the selected numeric axis. Eras are separate persistent records, never disguised events; unknown boundaries must not imply durations. Timeline views/pan/zoom are not library records; reuse Navigation for entry opening and workspace restoration.

## Creature and future Ecosystem continuity

- Keep all creative Creature editor fields optional, including the name (use the existing Unnamed creature fallback); validate supplied text, stable IDs and image data normally.
- Plan future Ecosystem Atlas work around the existing Creature records and stable relationship IDs. Preserve their lore, relationships, gallery and shared navigation/UI conventions; do not create a disconnected duplicate creature library.
- Treat ecological diagrams, food chains, hierarchy and biome/habitat interactions as a deferred milestone until the user requests implementation. Never silently reinterpret free-text relationships or habitat prose as ecological rules. Follow PROJECT_CONTEXT.md for the current planned scope.

## Protect the actual library

- Never casually delete, replace, reset or overwrite a user's data folder, SQLite database, image files or backups. Git-ignored data is not disposable. Never run destructive experiments/tests against the real library.
- Use the existing temporary-data fixtures or an explicitly isolated temporary library for experiments. Verify the effective data directory before commands that write/migrate/restore/clean data. Never repurpose a real library as a test fixture or cleanup target.
- Preserve existing entries, images, relationships and backward compatibility. Test error handling so a failed save does not appear successful or discard saved data.
- Treat schema, persistence and backup-format changes as high risk. Explicitly plan old-data compatibility, validation, migration, rollback, and appropriate tests before implementation; distinguish SQLite schema version from API/archive versions.
- Before a genuinely risky migration or restore-related operation, recommend or create a **verified backup** and state the recovery strategy. Verify recovery using an isolated copy; do not use the real library for a restore experiment. Existing routine restores already have validation/checkpoints—preserve them.
- Preserve the entire library when updating code. Stop its server before filesystem copies, including WAL/SHM considerations, or use the portable ZIP workflow. Never assume image records alone are a complete backup.

## Test according to risk

- Documentation-only: check accuracy, referenced files/commands, Markdown and the actual diff; a full app suite is unnecessary.
- Small isolated presentation change: run appropriate targeted checks, including visual/responsive/accessibility checks when affected.
- Feature spanning modules: exercise affected user flows and relevant integrations.
- Database, persistence, imports/exports, location relationships or image storage: run relevant regression tests and broader checks where appropriate, including old-data/error/restart/round-trip cases.
- Major architecture or substantial cross-cutting work: run the full available suite before declaring completion when the environment permits it.
- Do not automatically run the full suite for every minor edit, reinstall dependencies/browsers every task, or repeat broad passing checks without a reason. Do not skip important checks merely to save credits. Investigate failures; do not conceal them by removing assertions, inflating timeouts, or claiming a retry proves a root cause fixed.
- If a check cannot run, state why and what remains unverified. Claim a test passed only after observing its successful execution; source inspection, test counts, old reports and CI configuration are not current passing results.

## Finish with a scoped review

- Inspect the actual diff and status. Check for accidental/unrelated edits, data compatibility problems and obvious regressions in the changed files and their necessary integration points. Do not re-audit the entire application by default.
- Confirm the requested behavior is implemented and relevant checks actually ran. Resolve regressions caused by the change or clearly disclose remaining blockers.
- Update PROJECT_CONTEXT.md only for important durable changes to architecture, dependencies, storage, commands, implemented status or useful discoveries that prevent repeated investigation. Edit the relevant portion; do not rewrite it after every task. Keep it concise, factual and free of speculative claims or chronological work logs. Put detailed user procedures in README.
- Explain the result and why it matters in a few useful sentences. Name the changed files, actual checks, and relevant limitations/risks without overwhelming the user with internals.
- Distinguish saved working-tree changes, local commits and successful GitHub pushes. Never claim publication or a passing hosted CI run without evidence. If tools/access are unavailable, explain the concrete limitation rather than pretending the action happened.
