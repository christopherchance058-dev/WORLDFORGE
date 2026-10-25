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

## Category rules

- Show the world banner only on All entries. All existing and future categories allow an initial name and icon at creation; afterward, expose only color editing. Preserve saved names/icons and relationships. Reuse the shared expanded preset palette, custom color picker and default reset, with readable link shades in Light and Dark themes.

- Standard category browsers, including Characters and future categories, reuse the common heading, search/size/create/sort toolbar and section count styling. Keep specialist filters/fields. Use a distinct workspace only when functionality needs it (Location hierarchy, Maps).

## Shared entry presentation

- Reuse `entry-profile.js` (`EntryProfile.header`, `section`, `facts`, `field`) and shared profile/editor styles for current and future categories. Keep category-specific fields and validation without creating a different header, heading scale, image layout or action pattern for each category. Cards continue to use `EntryCards`: square thumbnail beside title/metadata/tags, full-width preview below, and natural card heights. Reuse this format for all future category cards.
- Recommend 1024 × 1024 px (1:1) for entry portraits, emblems, illustrations and gallery previews. Square framing is display-only: accept other dimensions, preserve original files and provide full-image links. Maps retain their natural aspect ratio; world banners retain their 2400 × 800 px (3:1) guidance. Do not resize/crop stored files to enforce a preview shape.
- Saved entries open through the shared reading dialog over the existing workspace. Reuse its icon actions, readable tags and aligned label/value rows; hide empty optional fields and preserve original images, links and browsing context. Shared editor keyboard handling belongs in `editor-keys.js`: Enter advances through visible text fields, Shift+Enter adds multiline breaks, and autocomplete selection takes priority. Q/E must never navigate while a text control has focus; leaving dirty editors reuses the discard guard.
- Category colors belong only to clickable entry references, never ordinary labels/headings. Reuse `CategoryColors.apply(element, targetEntry)` for both @ references and structured links so the destination category determines the theme-readable shade. New categories get shared defaults and the existing color setting; preserve optional category color metadata through renaming, saves and backups, with focused tests. Keep reading-field badges neutral and text-width through `EntryProfile.field`.
- Category editors must keep descriptive classifications open to custom text and suggestions. Optional relationships reuse `Geography.flexiblePicker` for multiple stable-ID selections plus explicit, neutral unlinked notes; never auto-create entries or auto-link names. Keep structural category/parent/travel, numeric/date and image safeguards. Document real exceptions, preserve old singular links when extending models, and test notes, backlinks, deletion and backups. Unlinked selection labels are intentionally plain (no @ parsing); narrative fields retain shared @ linking.
- For shared presentation changes, check populated and sparse Character, Faction and Location views/editors in Light and Dark themes, including linked text and image bounds. Follow the existing risk-based testing and desktop-priority rules.

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
