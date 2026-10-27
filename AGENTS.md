# WORLDFORGE development rules

Read this and [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) at the start of a task. User instructions take precedence. Context maps the implementation; verify affected source rather than treating documentation as proof.

## Work and communication

- Check Git status/diffs first; preserve uncommitted work. Never reset or discard user changes.
- The user is nontechnical. Handle implementation and verification; discuss designs before coding unless execution is requested. Keep explanations and investigation focused. Do not invent lore, features or passing checks.
- Reuse the existing stack/components; make the smallest complete change. Avoid unrelated refactors, speculative abstractions, new services/dependencies or storage changes without a concrete need and authorization.
- Commit/push only when authorized for the current work. Earlier publication requests are not standing permission. Report local edits, commits, pushes and hosted CI results separately.
- **Edit README.md only when explicitly requested.** Keep requested descriptions short and nontechnical; preserve backup/restore/moving/update instructions at the end unless changes are requested. Developer notes belong in PROJECT_CONTEXT.md, not README.
- Keep AGENTS.md for durable rules and PROJECT_CONTEXT.md for current architecture/compatibility. Replace outdated statements rather than append work logs. Create a temporary handoff only for unfinished work; consolidate useful facts and remove it when complete. Git history retains completed milestones.

## Protect the library

- Never experiment against real `data/`, databases, images or backups. Git-ignored data is not disposable. Use `tests/fixtures.js` or an explicitly isolated `WORLDFORGE_DATA_DIR`; verify the effective directory before writes/migrations/restores.
- Preserve existing records, IDs, unknown/legacy JSON fields, image originals and backup compatibility. Failed saves must preserve both saved data and drafts.
- Persistence/schema/archive changes need explicit compatibility, validation, rollback and recovery planning. Before a genuinely risky migration/restore, recommend or create a verified backup; test recovery in isolation. Preserve routine restore safeguards.
- Copy the complete library only with the server stopped (including SQLite WAL/SHM considerations), or use portable ZIP exports. Never assume images or one live SQLite file alone form a complete backup.
- Render user content with safe DOM text APIs. Preserve normalized pin coordinates, stable-ID relationships, revision checks and existing geographic safeguards.

## Testing policy

- Use the smallest relevant targeted checks without asking. Documentation-only changes need accuracy/link/diff checks, not application tests. Presentation changes need affected views/themes; integration/persistence changes need relevant flows, failure cases and compatibility checks.
- **Reserve full-suite testing for completed development milestones, not each prompt, correction, commit or push. Always ask for explicit approval before a full run**, including architecture/shared-UI/persistence changes. Explain the benefit and expected time/cost when known; wait for approval. Do not repeatedly propose it mid-milestone or split a full run into batches to bypass approval. Each repeat full run needs approval again.
- Continue implementation and targeted checks while awaiting a decision; disclose remaining coverage limits. Do not reinstall dependencies/browsers or repeat passing checks without a reason. Investigate failures without weakening assertions or hiding them behind longer timeouts/retries.
- Prioritize desktop. Do not add mobile-specific work/screenshots or keyboard/IME tests unless requested. Existing checks follow the scoped policy above.
- Inspect the final diff/status. Report only observed results; historical counts and CI configuration do not prove current tests pass.

## Linking and connections — every category

- Integrate shared `@` linking into appropriate new narrative/short-text fields via `DescriptionLinks.bind`, `collectFields`, safe rendering/plain previews and nested-owner validation. Preserve field limits, compact editors and literal text. Dates, classifications, numeric/structural controls, uploads and neutral picker notes stay plain; document real exceptions. Test insertion/save/reopen, rename/deletion, surrounding text and affected persistence flows.
- Every existing/future/custom category inherits the shared Connections editor and **one Connections & linked lore reading section**. Reuse `connection-model.js`, `connections.js` and the central specialist adapter; avoid duplicate facts or category-specific backlink headings.
- Common connection questions already appear in ordinary collapsible sections via `ConnectionModel.standardGroupsFor`. Optional means users may leave questions unanswered, not that they must add them first. Reuse specialist selectors; do not duplicate them. Empty default questions must not create saved rows, reader facts or dirty drafts. Preserve matching saved row IDs, owners, notes and unknown fields.
- **Connections & linked lore** editing is for niche suggestions and custom fields. Use the Faction Allies/Rivals picker UI: selected chips, searchable targets from any category, typed eras and neutral unlinked notes. Retain custom naming/rename/remove and @-linked notes/shared history. Never auto-create entries or link by matching names.
- Generic connections do not weaken location-parent/birthplace/travel safeguards. Preserve legacy catch-all IDs/notes as an editable Other connections draft; move them only on explicit successful save, never on startup/cancel/failure.
- Reading rows use EntryProfile's consistent horizontal neutral label badges and destination-colored chips. Distinguish outgoing, incoming provenance and narrative @ mentions; never infer inverse facts, membership, magic/ecological rules or dates. Preserve bounded search/filters, navigation, deletion snapshots and backups; test typed entry/era ID collisions and owner-local references.
- Characters/Creatures can manually select multiple **Eras lived through**, using live era names/art and missing-era fallbacks. Never calculate lifespan/calendar correspondence. The heading has no “(optional)” suffix. Extend lifespan presentation to other categories only when warranted.
- **Other appearances & images is always the final editor section**, after connections/eras. Mark gallery details with `data-editor-gallery`; reuse the shared final slot and category-owner/draft callbacks. Future categories follow the same rule.

## Vocabulary and shared UI

- Prefer existing square SVG icon buttons for recognizable actions, with accessible names and tooltips. Save actions use green text buttons labelled “Save [subject]”, never floppy-disk icons. Use Maps’ magnifying-glass zoom icons and distinguish different actions with different icons; avoid redundant close/back controls. Keep meaningful text for content choices, tabs and relationship wording. Reuse shared theme surfaces, spacing and entry/category design; category colors still belong only to clickable references.

- Creative classifications accept custom text with optional suggestions. Keep custom calendar/unit names and written dates; never assume all worlds use years or convert between calendars without user-defined correspondence. Retain structural ID, hierarchy, numeric and image safeguards.
- Category names/icons are chosen at creation and fixed afterward; existing categories expose color editing only. Use shared presets/custom/reset and readable Light/Dark colors. Show the world banner/controls only on All entries.
- Category browsers reuse the common heading/search/card-size/create/sort/count layout. Preserve specialist filters; use separate workspaces only where functionality needs them (e.g. Maps, location hierarchy).
- Reuse `EntryCards`: square thumbnail beside title/tags, full-width preview below, natural heights, no category/year/species/occupation/status/type metadata rows. Reuse `EntryProfile.header/section/facts/field`: aligned neutral label/value rows, shared headings/actions/tags, hidden empty fields and retained reading/browsing context.
- Category colors apply only to clickable references via `CategoryColors.apply`, for both @ and structured links; ordinary labels/headings stay neutral.
- Recommend 1024 × 1024 for portraits/illustrations/galleries; accept other sizes and preserve original files/full-image links. Square cropping is display-only. Maps keep their aspect ratio; world/era banners use 2400 × 800 guidance. Keep primary era card art separate from timeline art and include both in validation/backup remapping.
- Editors reuse collapsible sections and the image sidebar. Errors belong beneath the heading in `.form-error` and scroll into view, preserving drafts. Locations require only a name; Characters/Creatures/Magic allow blank names with their existing Unnamed fallback. Validate supplied optional values normally.
- Reuse `Navigation.visit` and state/restore hooks. Saves/refreshes are not navigation visits. `editor-keys.js` owns Enter-next/Shift+Enter-newline; autocomplete takes priority. Q/E must not navigate in text controls, and leaving dirty editors uses the shared guard. Preserve upload/save locks and era-editor guards.
- History keeps Events/Eras tabs under one category. Eras are independent typed records, not ordinary entries. Timeline is an Atlas projection: compatible numeric dates only, unknown boundaries imply no duration; event cards show chronology/type/certainty instead of prose, with icons only for predefined types. Pan/zoom/filter state is session-only.

## Deferred direction

Canvas is a standalone Atlas workspace. Add existing entries directly; its displayed entry list comes from diagram nodes, never a separate membership requirement. Extend the reusable diagram model/editor for future domains; family trees and faction hierarchies require their own rules and layouts. Preserve legacy serialized collection/link keys behind the compatibility boundary so old libraries and backups remain readable. Do not duplicate encyclopedia records or infer ecological facts from free-text lore.
