# Shared folders — completed implementation handoff

User authorized implementation of the pasted reusable folder prompt and agreed refinements: one folder per entry, tags for overlapping groups, flat category folders, All/Unfiled views, scoped search, drag/drop plus conventional moves, and safe persistence/backups. Implementation is complete in the working tree. The user authorized committing and pushing this milestone to a separate branch, `feature/category-folders`. This handoff is included in that publication commit. The implementation base is `05d0f7410d7bdf31d34cea1c092403c9bf778413` and main must remain unchanged. Preserve any subsequent uncommitted changes and the entire real library.

## Implemented behavior

- Shared category folder strip: create, rename, open, counts and safely delete. Case-insensitive duplicate/reserved names rejected. Deleting a folder keeps records in Unfiled.
- Shared EntryCards movement button and native drag/drop into visible folders or Unfiled; invalid drops and failed saves preserve records. No duplicates or entry timestamp/content changes from moves.
- All category views remain available; folder views scope cards/search. Create inside a folder assigns only on successful save; cancelled creation has no membership. Successful creation clears active search/specialist filters so the new card is visible.
- Characters integrates its existing browser; Locations filters the card overview independently of the intact geographic tree/parents; History shares folders across Events/Eras, with typed IDs to avoid collisions. Ordinary/custom/future categories using the normal browser automatically participate. All entries stays global; Maps/Timeline projections ignore folders and references keep opening entries.
- Folder selection participates in session Back/Forward and resets on world switching, restore and reload. Compact wrapping controls and dialog/card actions use theme surfaces; Light/Dark desktop screenshots inspected.

## Architecture and compatibility

- New `folder-model.js` (browser/server) validates/recoveries typed organization; `folders.js` supplies shared controls, creation context, filtering and movement. No dependency added.
- `organization:{folders:[{id,category,name}],assignments:[{kind,id,folderId}]}` lives separately from lore records. Each Store/world gets an additive SQLite `folder_organization` singleton. Schema remains 5; API/ZIP remain 6. Startup does not rewrite existing entry content.
- Revision-checked saves carry organization transactionally. Old PUT clients omitting organization preserve it; deleted/category-changed records release existing memberships. New cross-category/duplicate/malformed memberships fail validation. Missing imported/read references recover as Unfiled.
- Exports/checkpoints/Trash include organization through Store.state; old ZIP/JSON replacement imports without it restore Unfiled. Current-version backups preserve folders; older software cannot manage/export them reliably. Original image files are unchanged.
- Existing source integrations: api-client.js, app.js, storage.js, backups.js, server.js, index.html, entry-cards.js, navigation.js, characters.js, geography.js, eras.js, creature-model.js (Bestiary compatibility projection) and styles.css. PROJECT_CONTEXT.md documents the permanent shared integration rule; README.md has concise usage instructions. AGENTS.md unchanged.

## Observed verification

Final command: `npx playwright test --reporter=json --output=/tmp/worldforge-final-regression-results > /tmp/worldforge-final-regression.json`.

Result: **221 passed, 0 failed, 0 skipped, 0 flaky** (approximately 7m53s). Report parsed and verified after process exit 0. Includes all 213 existing tests and 8 new tests in `tests/folders.spec.js` / `tests/folder-integrations.spec.js`.

New coverage includes create/rename/delete, create under active search, Unfiled, menu moves, real drag/drop, failed saves/external drops, restart, typed era/event collisions, location hierarchy preservation, future/custom category reuse, validation/reserved names, old-client omission, world isolation/category changes, ZIP/cross-world restore and older ZIPs, stale-revision rejection, invalid imported memberships, rollback organization verification, scoped search/cancel creation, linked relationships/@ navigation, and actual moved-entry map-pin opening. Light/Dark screenshots inspected at 1000px desktop width; no overflow. No new mobile-specific tests added.

Syntax checks and final `git diff --check` passed. The sandbox prevented test servers from starting; authorized escalated runs used only fixture-created temporary `worldforge-test-*` libraries. No real library was used for testing, migration or restore.

## Resume instructions and scope limits

Read AGENTS.md, PROJECT_CONTEXT.md and this file, then inspect git status/diff. Do not restart or overwrite the completed implementation. No known implementation blocker remains. Verify the actual branch, HEAD and remote state. Discuss the user's next request; this publication authorization does not authorize future commits or pushes.

Folders are flat and category-specific. No nesting, bulk selection or multi-folder membership. Specialized future browsers must reuse the shared module through the documented hooks. This handoff preserves continuity across usage-limit interruptions; it does not schedule automatic work.
