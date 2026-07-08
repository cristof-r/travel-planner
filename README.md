<div align="center">

# Travel Planner for Obsidian

**Plan trips in Obsidian — starting with a per-trip packing list.**

[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](./manifest.json)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.6.6%2B-7c3aed?style=flat-square&logo=obsidian&logoColor=white)](https://obsidian.md)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

</div>

---

## Why

This vault already had a working but global packing-list system (one shared list, reset before every trip, no history). This plugin makes packing lists **per-trip** instead, backed by a reusable item catalog. See [`docs/requirements.md`](docs/requirements.md) and [`docs/packing-list/requirements.md`](docs/packing-list/requirements.md) for the full requirements and research behind this.

Packing lists are the first feature built. Itinerary, bookings, and budget tracking are documented in `docs/requirements.md` for later.

## Features

| | |
|---|---|
| **Create Trip with Packing List** | Prompts for a trip name and which categories apply, then creates a trip folder: the trip note (embedding a live packing table), one small note per packed item, and the Base that renders them as a table |
| **Insert Packing List into Current Note** | Same generation, anchored to the active note's own folder instead of a new trip folder |
| **Reset Packing List in Current Note** | Sets every packing-status column back to its type's zero value (`0` or unchecked) on every item note in the active note's `items/` subfolder — quantity is left untouched |
| **Create Packing Item Note** | Scaffolds a new catalog item note (name + category frontmatter) in the catalog folder |
| **Create Trips Overview** | Scaffolds a Bases view listing every trip note (`trip: true`) with destination/dates columns |
| **Create Catalog Overview** | Scaffolds a Bases view of the catalog folder, with one table per category |
| **Create Example Data** | One-click demo: fills in any unset trips/catalog folder and field settings with sensible defaults, seeds a handful of catalog items across every default category, and creates a sample "Example Trip" — the only command that doesn't refuse when settings are unconfigured |

All commands are available via the Command Palette (`Ctrl/Cmd+P`).

## Data model

- **Item catalog**: read live from a folder of item notes — one note per item, with name/category frontmatter — rather than stored in plugin settings. Editing an item's note (or adding a new one) changes the catalog immediately — items stay linkable, searchable, and visible in the graph like any other note, instead of living in an opaque settings blob.
- **Multiple categories per item**: the category field can hold a single value (`travel-planner-category: Clothing`) or a YAML list (`travel-planner-category: [Clothing, Sport]`) — both formats are read the same way, so single-category notes keep working unchanged. An item tagged with several categories shows up under each of them. `Create Packing Item Note` accepts a comma-separated list ("Clothing, Sport") for this, with suggestions that only ever complete the segment currently being typed.
- **Color-coded, editable categories**: every category has a color swatch shown in the settings list, the trip-creation category picker, and category suggestions. New categories get a deterministic default color computed from their name; click a category in **Settings → Travel Planner** to rename it and pick its own color via Obsidian's native color picker.
- **A trip is a folder, not a single note** — `Trips/<name>/`:
  - `<name>.md` — the trip note: `trip: true`, `destination`, `start_date`, `end_date` frontmatter, with the packing table embedded via `![[Packing.base]]`.
  - `items/<item>.md` — one small note per packed item, with its category, a `quantity` (how many the trip needs, default `1`, manually adjustable), and each configured packing-status column at its type's zero value (`0` for a number column, `false` for a Yes/No column).
  - `Packing.base` — a generated Bases view over `items/`, with category, quantity, and each status column as real, editable columns.

  This is the only way to get an actually interactive table: Markdown tables can't hold interactive cells (only a single leading `- [ ]` on a list line is ever clickable), but Obsidian Bases renders boolean properties as clickable checkboxes and number properties as inline-editable cells — so ticking "Bought" or entering how many are packed both write straight back to that item's note.
- **Packing-status columns are configurable, and typed** (Settings → Travel Planner → Packing status columns): add/remove columns beyond the Packed/Bought default, choosing Yes/No or Number for each (Packed defaults to Number — a packed *count* against the quantity — while Bought stays Yes/No). Each becomes its own frontmatter key (derived from the label, e.g. "Needs Repair" → `needs-repair`) and its own column in every trip's generated table. A column's type can't be changed after creation — remove and re-add it instead. `Reset Packing List` zeroes every configured column (`0` or `false` per its type) but never touches `quantity`, since that's "how many I need," not packing progress.
- **Overview Bases** (optional): the two "Create ... Overview" commands scaffold `.base` files for browsing all trips or all catalog items at a glance, the same way this vault's old `Mitnahme.base` did for the previous packing-list system. The catalog overview filters each category view with `list(field).contains("category")`, so it matches items whether their category field is a bare value or a list. These are generated once as a starting point; edit the `.base` file afterward like any other Base.

## Configuration

Go to **Settings → Travel Planner**:

| Setting | Description | Default |
|---|---|---|
| Trips folder | Where new trip notes are created | `Trips` |
| Catalog folder | Folder of item notes read as the catalog | `Trips/Packing Catalog` |
| Categories | Ordered, colored list controlling display order — click one to rename/recolor it; any category found only in the catalog is still included, appended at the end | 21 categories covering clothing, gear, logistics, and climate — see `DEFAULT_CATEGORY_NAMES` in `src/constants.ts` |
| Packing status columns | Yes/No or Number columns shown in every trip's packing table, alongside the fixed Quantity column; each becomes an editable column (checkbox or number field) | `packed` (Number), `bought` (Yes/No) |

The item catalog's frontmatter field names (`travel-planner-name` / `travel-planner-category`) are fixed, not configurable — namespaced so they won't collide with other plugins' properties on the same notes. Every command that writes files still refuses to run with a Notice if you clear a required setting back to empty: `Create Trip with Packing List` and `Create Trips Overview` need a trips folder; `Create Packing Item Note` and `Create Catalog Overview` need a catalog folder.

## Localization

The plugin's UI text (settings, commands, notices, modals) follows the language set under Obsidian's **Settings → General → Language**, currently English and German. Your own data — trip names, category names, catalog item names — is never translated, only the plugin's own chrome. See the "Localization" section in [`AGENTS.md`](AGENTS.md) for how to add another language.

## Building

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io)
- PowerShell 7+ (Windows deploy script only)

### Development

```bash
pnpm install
pnpm dev
```

### Deploy to a vault

Pass the vault root (the folder that contains `.obsidian`) to the deploy script for your platform. The script installs dependencies, produces a production build, and copies `main.js` and `manifest.json` into the correct plugin subfolder.

**Windows (PowerShell)**

```powershell
.\build.ps1 -VaultDir "C:\path\to\vault"
```

**Linux / macOS**

```bash
chmod +x build.sh
./build.sh "/path/to/vault"
```

After deploying, reload Obsidian or toggle the plugin off and back on under **Settings → Community plugins**.

## License

[MIT](LICENSE) © Cristof Rojas
