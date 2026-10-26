# Universal connections and optional era banners — completed

User approved universal flexible connections, one consistent horizontal reading section, optional multiple eras lived through for Characters/Creatures, and permanent future-category agent/context guidance. Implemented in the working tree on `feature/category-folders`, based on published folder commit `8bcd731e5eb1ba90fe67abfe341782ec0a12cf8d`. The user authorized committing and pushing this revision to the same feature branch; this handoff is included in that publication commit. Main remains unchanged. Preserve all changes and the real library.

## Implemented behavior

- Exactly one shared Connections & linked lore editor on every category, custom/future categories, and eras. Existing Character/Creature/Magic rows keep their original JSON owners; generic entries/eras use optional top-level connections. The editor gathers all owners with transient routing markers, then strips markers and returns each saved row to its original owner. No duplicate editor, startup migration or copies of lore records.
- Multiple arbitrary entry targets plus separately typed era targets, open relationship wording/suggestions, neutral unlinked notes and optional @-linked notes/shared history. Existing place/parent/travel/participant safeguards remain intact. Blank optional fields are not inserted into untouched records.
- One reading section with EntryProfile horizontal neutral label badges and category-colored target chips. Outgoing specialist facts and flexible rows join truthful incoming references; incoming category labels (Referenced in history, Connected creatures, etc.) are badges rather than headings. Incoming rows show source wording and never invent inverse facts. Operational location hierarchy/travel sections remain functional.
- Search, category/direction filters, 12-row disclosure and expandable written notes keep large lists manageable. Registered narrative @ mentions have a separate filter and do not become inferred relationships. Back/Forward restores connection query/filter/list disclosure state along with existing context.
- Characters/Creatures optionally select multiple livedEraIds manually. Saved era timeline artwork appears in linked banner cards; missing artwork gets a plain card, deleted eras retain readable names. Selected eras expose incoming lived-through references on the era. Dates/lifespan/calendar correspondence are never inferred.

## Architecture and compatibility

New `connection-model.js` provides typed validation, row normalization, registered mention enumeration and deletion snapshots. New `connections.js` provides shared editor, central specialist adapters, reader, search/navigation hooks and banners. Existing category modules retain specialist lore/image/field logic but delegate flexible connection editing/reading. Legacy backlink hooks remain no-ops for compatibility; the shared reader owns incoming rows.

Rows keep existing entryIds/entryId where relevant, plus optional eraIds, formerEraTargets, stable IDs, selectionNotes and row-owned textReferences. Generic connections, livedEraIds and livedEraNames are additive JSON. Nested @ validation includes generic rows; era dialogs dispose shared field bindings correctly. Normal revision saves/ZIPs preserve the JSON and existing era images participate in existing image remapping. No new dependency, schema/table/API/ZIP version or destructive migration. Use the current app version to edit/export expanded metadata reliably. Original image bytes and real library remain untouched; all experiments used isolated fixture libraries.

Changed integrations: app.js, category modules/models, description-links.js, era model/editor, storage validation, navigation.js, server static allowlist, index script order and shared styles. AGENTS.md and PROJECT_CONTEXT.md explicitly require the common feature, UI and concepts for all future categories. README has concise usage instructions.

## Observed verification

- First full run: 222 passed / 3 failed; fixed old category-local selectors, unwanted empty optional History metadata and old row-editor location.
- Post-refactor specialist/linking run: **46 passed**.
- Targeted new connection/History/flexible-editor/universal-link run: **25 passed**.
- Final broad run command: `npx playwright test --reporter=json --output=/tmp/worldforge-universal-final > /tmp/worldforge-universal-final.json`. Observed **225 passed / 2 failed / 0 skipped / 0 flaky** out of 227 (about 8m7s). The two failures were tests: a detached timeline-track handle during a scheduled repaint, and an unscoped card selector made ambiguous by a legitimate new era backlink. Geometry now reads from the stable scene atomically, retaining assertions; intended History card selection now scopes to #entries.
- Final affected recheck: `npx playwright test tests/history-connected.spec.js tests/history-ui.spec.js tests/connections.spec.js --reporter=json --output=/tmp/worldforge-universal-final-checks > /tmp/worldforge-universal-final-checks.json`: **20 passed**, including both corrected tests. A separate final six-test connection run also passed, with populated Light/Dark era banners visually inspected.
- Thus **all 227 distinct tests have passing results across the broad run and focused rechecks**. There was no second complete full run after the two test fixes. Do not describe the broad run alone as 227/227 passing.
- New tests cover custom/generic and legacy editors, typed entry/era ID collisions, @ notes and malformed registries, draft protection, source direction, horizontal badges, multiple lived eras, banner/plain/missing fallbacks, linked incoming lived references, restart, cross-world restore, era deletion snapshots, bounded search/category/direction filters, narrative mentions and navigation restoration. Existing suites retain data/image/backups/folders/navigation/category checks.
- Final syntax checks and git diff --check passed. Light/Dark reading/editor/banner screenshots inspected; desktop is the implementation priority. Tests required sandbox escalation solely to run local fixture servers/browser processes.

## Resume

Read AGENTS.md, PROJECT_CONTEXT.md and this file; inspect git status/diff. Implementation and requested guidance are complete; no known blocker remains. Preserve existing folders and all user data. Discuss the next request; commit/push only when newly authorized. This handoff records continuity across usage limits; it does not schedule automatic work.
