# Packing List — Requirements

Scoped-down starting point for the travel planner: the packing list is being built first, standalone, before itinerary/booking/budget features. See `../requirements.md` for the full app requirements this fits into.

## Context: existing vault system

The vault already has a working, if manual, packing-list system at `10 Personal/Mitnahme/`:

- **~134 item notes** under `10 Personal/Mitnahme/Items/`, one Markdown file per item, each with frontmatter: `artikel` (name), `kategorie` (category), `eingepackt` (packed bool), `gekauft` (bought bool), `zuhause` (bool — item currently lives at home, not with the traveler yet).
- **Categories in use**: `general`, `anziehsachen` (clothing), `hygiene`, `elektronik`, `camping`, `sport`, `sonstiges` (misc).
- **Aggregation** via `Mitnahme.md` (Dataview tables per category + a "not yet packed" view) and `Mitnahme.base` (an Obsidian Bases equivalent with the same per-category table views).
- **Bulk reset**: a `dataviewjs` block with buttons to set `eingepackt`/`gekauft`/`zuhause` to true/false across all items at once, meant to be run before each new trip.

### Limitations this plugin should fix
- **Single global list, no per-trip history.** Resetting `eingepackt` before a new trip destroys the record of what was packed for the last one — there's no way to look back.
- **No trip scoping.** All ~134 items show up every time; the user manually mentally filters out categories that don't apply (e.g. skip camping gear for a city trip). Nothing enforces or remembers that decision per trip.
- **No quantities.** Everything is a boolean. Items that scale with trip length (socks, underwear) can't express "5 pairs for a 5-day trip."
- **No concurrent trips.** Because state is global, planning two trips at once (or packing for one while still unpacking from another) isn't possible.
- **`zuhause` is a workaround**, not a modeled concept — likely exists because two people share this vault and some gear is only in one location. Worth clarifying rather than carrying forward as-is.

## Research: how other apps handle packing lists
- **PackPoint** — generates a list from destination + trip length + planned activities + weather forecast. Single-purpose app, no itinerary/booking features, but the strongest prior art for auto-generation logic.
- **Wanderlog / TripIt** — neither has a packing-list feature at all. Validated gap in the mainstream apps.
- **Obsidian "Travel Planner" plugin** (`community.obsidian.md/plugins/travel-planner`) — ships a "pre-populated packing list with categorised checkboxes" per trip note. Closest direct prior art for an Obsidian-native implementation; worth trialing before building to see how far it already goes.

## Requirements

### Must have (MVP)
- **Per-trip packing list.** Each trip owns its own checklist instance instead of one global list, so packing history isn't overwritten by the next trip.
- **Category-based organization.** Preserve the existing categories (general, clothing, hygiene, electronics, camping, sport, misc) but make them configurable rather than hardcoded, since not every category applies to every trip.
- **Reusable item catalog, stored as notes.** The catalog is read live from a folder of item notes (one note per item, frontmatter name + category) rather than duplicated into plugin settings — pointed at any folder the user configures, e.g. the existing `10 Personal/Mitnahme/Items/` folder itself, so nothing needs migrating and editing an item is just editing its note like any other.
- **Per-trip state, not global.** `packed` / `bought` (configurable) flags scoped to a trip, so two trips can exist without clobbering each other's state.
- **Scoped bulk actions.** "Mark all unpacked" and similar bulk operations apply to the current trip's list only — replacing the vault-wide dataviewjs buttons.
- **A real table, with configurable, typed status columns.** Category and quantity as visible columns, plus one editable column (checkbox or number) per configured packing-status field (default: Packed as a number, Bought as a checkbox) — not just a plain checklist.
- **Category selection per trip.** Ability to include/exclude whole categories per trip (e.g. drop camping gear for a city trip) so each trip's list is right-sized instead of always showing everything.
- **Multiple categories per item.** An item like a swimsuit is both clothing and sport gear — it should show up under either category's checklist rather than forcing one owning category.
- **Quantities.** Each trip-item note has a `quantity` (how many the trip needs, default 1, manually adjustable) independent of the configurable packing columns, so "packed" can track a count against it rather than a flat yes/no.

### Should have
- **Trip-type templates.** Predefined category/item sets for common trip types (weekend city trip, camping, beach, business) to cut down on manual curation per trip.
- **Weather-aware suggestions.** Pull a forecast for the destination/dates and surface weather-relevant items (rain jacket, sunscreen) — PackPoint's core value.
- **Per-traveler lists.** Support splitting a trip's packing list by person, since the vault is shared between two people.

### Nice to have
- **Shopping-list view.** Filter to not-yet-bought items as a dedicated view/export — the current "Noch nicht eingepackt" Dataview table already covers the packing equivalent; preserve that as a view rather than a separate feature.
- **Historical reference.** Surface "what did I pack last time for a similar trip" when starting a new one.
- **Cross-device sync** of live packing status while traveling (mobile use case) — likely out of reach for a desktop-only Obsidian plugin, listed here only as a future stretch.

### Backlog (documented, not built)
Deliberately deferred to keep each round scoped — not forgotten, just not yet justified against a bigger rewrite:
- **Trip-type templates** — needs curated per-trip-type item sets (weekend/camping/beach/business), a small content-authoring effort more than a code one.
- **Weather-aware suggestions** — needs an external weather API and a destination → forecast → item-suggestion pipeline; genuinely new integration surface.
- **Per-traveler lists** — needs a person/owner model layered onto items, which the current per-trip-item-note shape doesn't have yet.
- **Shopping-list view** — small (the catalog/trip Base-generation machinery already exists), deferred only because this round's scope was capped to quantity + settings cleanup, not because it's hard.
- **Historical reference** ("what did I pack last time") — needs a way to compare/link trips, which doesn't exist yet.

### Explicitly out of scope (for now)
- Luggage weight/airline baggage-limit tracking.
- Barcode scanning or receipt import for the `bought` flag.
- Real-time multi-device sync (see Nice to have — desktop/vault-sync only for now).

## Resolved decisions
- **Catalog storage: notes, not plugin settings.** The item catalog is read live from a configurable folder of item notes instead of being duplicated into plugin data. This matches the app's "own the plan as vault-native notes" goal, keeps items linkable/searchable/graph-visible like any other note, and — pointed at this vault's existing `10 Personal/Mitnahme/Items/` — means the existing ~134 items don't need migrating. A "Create Packing Item Note" command scaffolds new item notes with the right frontmatter fields.
- **Defaults, revisited: namespaced and generic, not empty.** After first shipping with no defaults at all (to avoid vault-specific assumptions), settings now default to `Trips` (trips folder) and `Trips/Packing Catalog` (catalog folder) — real, working values out of the box. `isCatalogConfigured()`/`isTripsConfigured()` still guard every command, since a user can still clear a folder back to empty.
- **Catalog frontmatter field names: fixed, not settings.** `travel-planner-name`/`travel-planner-category` were briefly configurable, then made fixed constants (`CATALOG_NAME_FIELD`/`CATALOG_CATEGORY_FIELD` in `constants.ts`) — one less decision to make, and the namespacing already avoids collisions with other plugins' frontmatter, so there was nothing left for a setting to usefully vary.
- **Quantity is fixed structure, not a configurable column.** Every trip-item note gets a `quantity` (default 1, manually edited per trip) regardless of which packing-status columns are configured — it represents "how many I need," a different kind of fact than a packing-status checkbox. This also resolves the "fixed quantities vs. a formula" open question below: quantity is manually entered per item, no auto-formula (e.g. `days + 1`) in this pass.
- **Packing columns are typed (`"boolean" | "number"`), not just booleans.** Packed defaults to `"number"` (a packed count against quantity) while Bought stays `"boolean"` (simple yes/no) — the user's own request was specifically for Packed to become a count, not for every column to. A column's type is fixed at creation (no in-place type change); removing and re-adding is the escape hatch. Bases infers checkbox-vs-number rendering from the note's actual property value type, so no extra Bases-syntax work was needed beyond writing the right zero value per type.
- **Overview visibility: generated Bases, not a plugin-side dashboard.** Rather than the plugin rendering its own "browse all trips/items" view, "Create Trips Overview" and "Create Catalog Overview" scaffold `.base` files — the same native Bases mechanism `Mitnahme.base` already used for the old system — then leave the user free to edit them like any other Base. No new UI surface in the plugin to build or maintain.
- **Categories are a list, not a single value.** The category frontmatter field accepts either a bare scalar or a YAML list, so an item (a swimsuit, say) can belong to multiple categories and show up under each one's checklist — while single-category notes keep working exactly as before, with zero migration.
- **Category color: computed default, user-editable.** Every category gets a deterministic default swatch (a hash of its name → hue) the moment it's first seen, so nothing ever looks unstyled — but clicking a category in Settings opens a popup to rename it and pick its own color via Obsidian's native color picker. Renaming there does *not* rename the category inside existing item notes (a decoupled display registry, not a source of truth) — a known limitation, not a bug.
- **A trip became a folder, not a single note — the only way to get a real interactive table.** Markdown tables cannot hold clickable checkboxes (only a single leading `- [ ]` on a list line is ever interactive; a checkbox inside a `|` cell is inert text). Obsidian Bases, however, renders boolean frontmatter properties as genuinely clickable table cells. So each trip is now `Trips/<name>/`: the trip note (frontmatter + an embedded `![[Packing.base]]`), an `items/` subfolder with one small note per packed item (category + one boolean per packing column), and the generated `Packing.base` itself. This was chosen over two lighter-weight alternatives — (a) two separate native checklists (To Buy / Packing List) with category as inline text, no real table; (b) a plain-text Markdown table using ☐/☑ symbols, toggled via a command instead of a click — because it's the only option that delivers an actual clickable table, at the cost of turning one note per trip into a small folder of notes per trip.
- **Packing-status columns are configurable, not hardcoded to "packed"/"bought."** Settings → Travel Planner → Packing status columns lets you add/remove boolean columns (each becomes its own frontmatter key, derived from the label). `Reset Packing List` resets *every* configured column to unchecked, rather than special-casing one as "the resettable one" — simpler and more predictable than guessing which custom column should persist across a reset.

## Open questions
- Is `zuhause` (item is at home, not yet with the traveler) a real per-trip concept worth keeping, or an artifact of two people sharing one gear pool? Likely **resolved as moot**: since packing columns are now user-configurable (any label, boolean or number), a user who wants this can just add an "At Home" column themselves — no first-class plugin support needed. Revisit only if that self-service path proves insufficient.

### Resolved
- ~~Fixed quantities vs. a per-trip-length formula~~ — resolved: fixed, manually entered per trip-item, default 1. See "Resolved decisions" above.
- ~~Should trying the existing "Travel Planner" Obsidian plugin come first?~~ — moot, overtaken by events: substantial original functionality (per-trip Bases tables, typed packing columns, multi-category items, color-coded categories) has since been built that goes well beyond what that plugin offers.

## Sources
- [Travel Planner — Obsidian community plugin](https://community.obsidian.md/plugins/travel-planner)
- [Best TripIt Alternatives 2026: 8 Apps I Switched to After 3 Years](https://tripstone.app/blog/tripit-alternatives)
- [Best Travel Planning Apps 2026: Top 7 Picks Compared](https://www.stippl.io/blog/best-travel-planning-apps-2026)
- Existing vault system: `10 Personal/Mitnahme/Mitnahme.md`, `10 Personal/Mitnahme/Mitnahme.base`, `10 Personal/Mitnahme/Items/*.md`
