# WORLDFORGE — development handoff

Prepared 26 October 2026. A session snapshot: verify the actual checkout and diff before working. AGENTS.md contains development rules; PROJECT_CONTEXT.md maps the architecture and implemented/planned features; README.md contains user procedures.

## Copy into the next chat

Continue WORLDFORGE, my existing local-first fantasy worldbuilding application. Read AGENTS.md, PROJECT_CONTEXT.md and PROJECT_HANDOFF.md, then check the branch, HEAD, working-tree diff, untracked files and remote state. Preserve every existing change and the entire real library.

I am not technical. Discuss my ideas and propose an implementation prompt before editing unless I explicitly ask you to execute. Handle the technical work yourself. Commit/push only when I authorize it for the current task; earlier push permission is not standing authorization. Explain things in plain language.

Keep the UI as consistent as possible across categories and workspaces: reuse the established cards, editor, reading dialogs, toolbars, typography, image framing, actions, colors, @ linking, keyboard behavior and navigation. Specialist Atlas tools may have layouts their function needs. All creative Creature form fields are optional, including the name; a blank name saves as Unnamed creature.

My intended future direction is an Ecosystem workspace under Atlas for food chains/webs, ecological hierarchy and habitat/biome interactions using the same Creature entries. The Creatures encyclopedia remains their source of truth. Preserve stable entry and relationship IDs. Do not infer ecological relationships from current free-text notes or automatically build the Ecosystem milestone from this handoff; discuss its design with me when I request it.

First report the verified checkout state and whether the latest local milestone is present. No new implementation task is assigned by this handoff. Wait for my next idea.

## Git and outstanding local work

- Workspace: `/workspace/WORLDFORGE`; active branch at preparation: `work`.
- Previous published base: `5cefae331a791ad2ab2e0e709c68d050b0251a93` (Wait for virtualized era rows before stress-test selection). Its hosted check passed all 199 tests. The newer relationship/gallery milestone and these handoff documents are published together after that base; verify the resulting main HEAD and remote rather than treating the base as current.
- Repository: `https://github.com/christopherchance058-dev/WORLDFORGE`.
- The user authorized committing and pushing the completed Creature relationship/gallery milestone and handoff documents to main at the end of this chat. They belong to the same publication commit. In the next chat, fetch current main and verify that `tests/creature-extras.spec.js` and the two Creature extras sections are present. Preserve any newer local work; do not overwrite it with an older checkout.
- Application files in this milestone: `creature-model.js`, `creatures.js`, `app.js`, `characters.js`, `description-links.js`, `storage.js`; adjusted `tests/creatures.spec.js`; new `tests/creature-extras.spec.js`.
- Documentation: PROJECT_CONTEXT.md and README.md include the implemented milestone; AGENTS.md and this handoff record continuity and planned Ecosystem work.
- Before coding, inspect the real status/diff and confirm the publication commit is present. No further code change is assigned by this handoff.

## Current product and shared conventions

- Multiple independent local worlds; encyclopedia categories, linked lore, recoverable world deletion and portable ZIP backups. No account or external cloud service required.
- Characters, Locations, Factions, History and Creatures have specialist fields. Locations support nesting. Existing category identity is fixed after creation, with color editing; the authorized Bestiary rename has specific compatibility handling.
- Maps and Timeline are separate Atlas destinations. History retains Events/Eras cards and World chronology settings. World chronology now sits between search and Card size in the History toolbar.
- Timeline preserves its compact UI: search/New menu, visible filters, pan/zoom/Fit/Jump above the ruler, Help disclosure, short counts and conditional Clear filters. Era display combines Illustrated/Compact/Hidden. Events/eras have Show on timeline, selecting the correct calendar/unit and revealing their dated row or undated list; Back restores context.
- History dates allow numeric coordinates and written dates with custom calendars/units. Eras are separate records, not duplicate events. Unknown dates stay unknown and a missing end does not invent a duration. No automatic calendar conversion or ecological graphs exist.
- Shared EntryCards show square thumbnail, title/tags and full-width preview. EntryProfile supplies reading headers and aligned fields. Original image bytes are preserved; square crops are display-only. Reading windows retain the browsing workspace.
- Universal @ uses stable IDs, live names and unavailable fallbacks. Typed era references distinguish entry/era IDs. Narrative fields use the existing codec; classification fields and neutral picker notes deliberately remain plain.
- Shared errors appear beneath editor headings and preserve drafts. Enter advances, Shift+Enter adds a newline, autocomplete takes priority; Q/E navigation respects focused text controls, upload/save locks and dirty-editor guards.

## Creatures: pushed foundation

Commit `aa68d06` added the first specialist Creature editor. Bestiary becomes Creatures through a compatibility projection, preserving IDs, lore, images, icon and category color. Startup reads do not rewrite SQLite or change revisions; a normal save persists the labels atomically. If both category names exist, preserve them separately and show a notice. Old ZIP/JSON imports retain compatibility.

The normal category browser and shared editor contain four collapsed lore groups: plain Classification and six narrative fields (Appearance and manifestation, Habitat and occurrence, Behavior and nature, Life cycle and propagation, Abilities and properties, Significance and uses). All are optional; narrative fields support @. The form accommodates fauna, flora, fungi, spirits and unconventional beings without adaptive fields or taxonomy restrictions. Shared Description, Short description, tags and primary illustration remain intact. Search includes specialist lore; empty reading fields/sections stay hidden.

## Creatures: latest relationship/gallery milestone

Two optional, initially collapsed sections match Character controls and styles:

- **Relationships & linked lore:** up to 200 rows, each with a unique stable ID, multiple entry targets, custom type/suggestions, neutral unlinked notes, linked relationship notes and linked shared history. Targets may be Characters, Magic, Locations, other Creatures, History events or custom-category entries. Eras work through @ notes, not the structured entry-ID picker. Rows can remain note-only; empty rows are omitted on save.
- **Other appearances & images:** up to 50 immutable additional images with stable IDs, optional @ captions, square previews, full-original links and removal controls. The primary illustration is independent. Mixed uploads report failures while retaining successful files and drafts. Removing/cancelling a gallery item does not delete its immutable original.

Reading dialogs show clickable outgoing relationships and derived Connected creatures on referenced entries, including Characters. Rename resolution uses IDs; deletion removes only the deleted target ID, preserving written lore and former target names. Search includes relationship types, names, notes/history, unlinked notes and captions. There are no inferred food chains or ecosystem rules.

Persistence stays inside optional `entry.creature.relationships` and `entry.creature.gallery`; no new tables or version changes. Model validation, nested @ validation, image enumeration, ZIP/remapping and legacy image conversion include these owners. `Characters.snapshot` includes `Creatures.draftState()` IDs/image URLs so gallery-only changes trigger the existing shared discard guard. Older payloads default to empty arrays. Use the current release for backups/editing of these new fields.

## Architecture and data safety

Plain HTML/CSS/browser JavaScript with shared globals; Node 24+, CommonJS and built-in SQLite. No frontend build. Preserve script order and the server static allowlist. New Creature modules are `creature-model.js` and `creatures.js`; use PROJECT_CONTEXT.md for other integration points.

SQLite schema remains 5; API/ZIP format remains 6. Shared @ registry remains version 1. Full metadata revision saves include entries, maps, eras and chronology. Image files are immutable and backups include registered originals.

Real library root: WORLDFORGE_DATA_DIR or `data/`. Never use it as a fixture or casually overwrite/delete Git-ignored data. Use `tests/fixtures.js` isolated temporary libraries. Whole-library filesystem copies require a stopped server or a safe SQLite-aware procedure; a live database file alone can omit WAL transactions. Existing restore rollback and validation must remain intact. For risky changes, plan and verify recovery in isolation.

## Verification observed in this chat

These results are historical observations, not automatic proof after future edits:

- Pushed Creature foundation: full local suite passed 199 tests.
- GitHub later failed an older dense-era stress test: it inspected visible virtual rows before the scroll redraw. Reproduced locally (1 failure in 8 runs); fixed by polling for an actual visible band, retaining assertions without longer timeouts or arbitrary sleeps. Corrected test passed 12 consecutive runs.
- Commit `5cefae3` hosted CI passed **199 tests**: https://github.com/christopherchance058-dev/WORLDFORGE/actions/runs/40266071349.
- Latest **relationship/gallery milestone:** full suite passed **204 tests**. Focused Character/Creature/linking/reading run passed 25 tests. An additional missing-gallery-file safeguard assertion was then added to the validation test and that focused test passed; no production code changed after the full pass.
- Coverage includes multi-category relationships/backlinks, @ notes/history/captions, typed eras, row removal and stable ownership, renames/deletions, blank/sparse entries, failed saves/discard cancellation, mixed uploads, original image bytes, restart, backup round trips and actual cross-world image remapping. Light/Dark reading/editor screenshots were inspected at normal/narrower desktop sizes.
- The 204-test result is local verification. The publication push starts a fresh hosted CI run; inspect that run before claiming it passed.

Commands: `npm start`; focused extras checks: `npx playwright test tests/creature-extras.spec.js tests/creatures.spec.js tests/characters.spec.js tests/universal-links.spec.js tests/reading-workflow.spec.js`; full regression: `npm test` when scope/risk justifies it. Do not rerun the full suite for a documentation handoff or minor button move. Do not reinstall dependencies/browser on every task if already present.

## Future Ecosystem direction

The user wants Ecosystem as a major Atlas workspace, alongside Maps and Timeline, for exploring food chains/webs, ecological hierarchy, habitats/biomes and creature interactions. Keep Creatures as the connected encyclopedia, not a second disconnected library. Reuse stable creature and relationship IDs and the established visual language. Exact ecological models, directional edges, biome entities, layout and interactions are **not designed or implemented** yet. Do not silently parse current habitat prose or relationship type strings into facts. This handoff records intent; request-driven discussion comes before implementation.
