# WORLDFORGE — development handoff

Prepared 26 October 2026. This is a session snapshot, not a replacement for checking the repository. Read AGENTS.md and PROJECT_CONTEXT.md first; README.md contains operating and recovery instructions.

## Copy into the next development chat

Continue development of WORLDFORGE, an existing local-first worldbuilding application. Read AGENTS.md, PROJECT_CONTEXT.md and PROJECT_HANDOFF.md first, then check the current branch, Git status, remote state and relevant recent changes. Preserve all existing work and data. Use the actual repository as the source of truth.

The latest application implementation at this handoff is commit `1f279f1` (Improve History browsing, era artwork and shared links). The user authorized bringing all work from `feature/history-phase-1` into `main`, together with this handoff. Verify the resulting main HEAD and remote rather than assuming the old feature branch is still current.

I am not technical. Discuss my idea and write a proposed implementation prompt before editing unless I explicitly tell you to execute. Commit or push only when I authorize it for the current task. Past push authorization is not standing permission for future changes. Explain things in plain language and handle the technical work yourself.

Inspect only task-relevant files and necessary dependencies. Use focused, risk-based tests; do not automatically rerun the entire suite for small changes. Preserve my library, images, backups and uncommitted work. Use isolated temporary libraries for all tests. This is a general fantasy worldbuilding application; do not assume my world consists of a single city and surrounding ocean.

No new development task is assigned by this handoff. Wait for my next idea after verifying the current state.

## Current product

- Multiple independent local worlds, encyclopedia categories, linked lore and an interactive map atlas; no account or cloud service required.
- Characters, Locations and Factions have specialist fields and relationships. Locations support nesting, including attaching an existing location as a child.
- Shared entry cards use square image/icon, title and tags, with a full-width description preview below. Ordinary cards omit metadata rows. Shared reading dialogs and editor styling apply across categories.
- The world banner appears only in All entries. Existing categories expose color editing; names and icons are chosen at creation. The common palette includes custom color/reset.
- Shared narrative fields support stable-ID @ links with safe rendering, current names after renaming and unavailable fallbacks after deletion. Appropriate future narrative fields must integrate that same system.
- Creative classifications accept typed custom wording with optional suggestions. Structural IDs, numeric coordinates and image validation retain necessary safeguards.
- Editor errors appear beneath the heading and scroll into view. Locations require only a name; optional supplied fields are still validated. Do not assume this name-only rule applies to every category.

## History features now implemented

- Structured optional chronology: numeric start/end coordinates, written dates, custom time units/calendars, event types and certainty. Legacy year fields remain compatible. Unknown dates never become invented dates or zero; a missing end never implies a duration.
- Horizontal visual timeline with pan, earlier/later, zoom, pointer-centered Ctrl-wheel zoom, Fit, Go to position and session Back/Forward restoration. Overlap rows and off-screen rendering keep the view usable.
- Search combines with event-type and certainty filters. Clearing restores results without changing records; Fit explicitly reframes matching dates. Incompatible units/calendars and unpositioned records remain available separately.
- History events can associate existing Characters, Factions and Locations using shared searchable selectors, multiple stable IDs and optional neutral notes. Reading views expose clickable links and incoming History references. Deletion does not cascade into linked entities.
- Eras are independent records under the existing History category. Events/Eras tabs are the primary browser; eras also appear in All entries. There is no separate sidebar category and no duplicate ordinary event record.
- Era descriptions support @ links, and any existing shared @ field can select an era. Typed references distinguish an era from an ordinary entry even if their IDs collide. Renames resolve live; deletion leaves readable unavailable references.
- Each era has independent card artwork and wide timeline artwork, with upload/replace/remove/full-original controls. Recommendations: card 1024×1024, banner 2400×800. Original files are preserved.
- Timeline eras have Illustrated and Compact modes, exact date widths, readable labels and separate overlap lanes. Unknown boundaries stay unknown; an open end is a boundary marker, not an artificial artwork span.
- Timeline event cards omit description snippets. Predefined event types receive icons; custom or unspecified types have no icon. Full detail opens through the shared reading workflow.
- World chronology sets the primary name/calendar/time unit used by the initial timeline scale and new records. Changing defaults does not rewrite saved dates or convert calendars.

## Architecture and persistence landmarks

- Plain HTML/CSS/browser JavaScript with shared globals; Node.js 24+, CommonJS server and built-in SQLite. No frontend build step. Preserve script order and the server static allowlist.
- `app.js` owns shared CRUD/render/save coordination. `entry-cards.js`, `entry-profile.js`, `editor-keys.js`, `navigation.js` and `description-links.js` provide shared UI/link behavior.
- `history-model.js` and `history.js` own History validation/editor/details. `timeline-layout.js` provides numeric geometry; `history-timeline.js` owns the read-only timeline workspace and session state.
- `era-model.js` and `eras.js` own separate era records/editor/reading/settings. `EraModel.project` is a read-only adapter for cards and chronology, never a persisted ordinary entry.
- SQLite schema remains 5; API/ZIP format remains 6. Additive `historical_eras` and `history_settings` tables store eras and world chronology. Normal full-revision saves preserve both. No destructive migration was introduced.
- Optional era image fields are `image` and `timelineImage`. Both participate in validation, backups and restore image-ID remapping. Removed/cancelled files remain retained.
- Shared @ registry stays version 1. Legacy entry tokens are unchanged; optional `kind: "era"` and the `era:` token scheme distinguish era references. Missing kind means ordinary entry. Shared target lookup caches era projections alongside existing entries.
- Older releases cannot reliably edit expanded chronology or typed era references and may omit eras from backups. Use current-version complete portable ZIPs.
- Data root is `WORLDFORGE_DATA_DIR` or `data/`. Git-ignored data is real user data. Preserve the whole library, including SQLite WAL considerations and images. Never run restore experiments against it.

## Verification record from the implementation session

These are previously observed results, not a claim that tests ran during every future handoff or checkout.

- Full Playwright regression: 186 cases; 185 passed and one desktop timeline-toolbar alignment assertion failed after adding the New era action.
- The toolbar spacing was corrected. The affected open-chronology suite then passed all 3 cases.
- Final affected run passed all 33 cases across `history-ui.spec.js`, `eras.spec.js`, `open-chronology.spec.js` and `timeline.spec.js`.
- Thus all 186 distinct cases have passing results across the regression run and focused rechecks. There was no second full-suite run after the scoped CSS fix.
- The new History UI tests cover typed-ID collisions, tabs/navigation, era linking/rename/deletion, specialist @ fields, separate images, original-byte preservation, reload/backups, real cross-world image remapping, display modes, icons and Light/Dark editor screenshots.
- The main promotion adds documentation and moves existing commits without changing application code; inspect the merge/diff rather than treating promotion as new feature implementation.

Commands: `npm start`; `npx playwright test tests/history-ui.spec.js tests/eras.spec.js tests/open-chronology.spec.js tests/timeline.spec.js`; `npm test` for justified broad regression. Tests use `tests/fixtures.js` temporary libraries. Install locked dependencies only when needed; do not reinstall them every task.

## Limits and next-session checks

- No automatic calendar conversion, arbitrary month/day arithmetic, multiple independent timelines or causal graphs. Numeric positions within different unit/calendar pairs are not interchangeable.
- Era references use universal @ links; they have not been added to every category-specific structured relationship selector.
- Navigation history is session-only. All metadata still loads/saves together; timeline virtualization is not server pagination.
- No pending implementation is intentionally left unfinished at this handoff. Verify current Git state and ask for the next requested feature; do not invent a roadmap or infer one from older phase documents.
