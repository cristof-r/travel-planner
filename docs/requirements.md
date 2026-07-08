# Travel Planner — Requirements

## Existing apps reviewed

| App | Core model | Strengths | Gaps |
|---|---|---|---|
| **TripIt** | Forward confirmation emails → auto-parsed master itinerary | Best-in-class email parsing, flight alerts/seat tracking, calendar sync, points/miles tracking (Pro) | No map/route view, no expense tracking, no cost splitting, weak collaborative planning |
| **Wanderlog** | Manual day-by-day itinerary builder with map | Drag-and-drop itinerary, interactive map, route optimization, budget + expense splitting (Splitwise-like), real-time collaboration, place recommendations, AI trip assistant (Pro) | Less automatic than TripIt for parsing bookings; some collaboration/AI features paywalled |
| **Google Trips / Google Travel** | Auto-surfaces bookings from Gmail | Zero setup, free, always in sync with inbox | No manual trip building, no sharing, limited to what Gmail can parse, no map/itinerary authoring |
| **Sygic Travel** | Offline-first, map-centric | Downloadable offline maps per city, POI discovery, real-time navigation | Weaker itinerary/collaboration features, smaller booking-import ecosystem |
| **Roadtrippers** | Route planner for road trips | Multi-stop route building, POI/campground/restaurant discovery along the route, live traffic and hazard overlays (e.g. wildfire smoke) | Road-trip only, limited to 4 countries, not useful for flight/hotel-based trips |
| **Kayak Trips** | Auto-imports bookings from Gmail | Free, zero manual entry for flights/hotels | Same limits as Google Travel — only what Gmail can parse |
| **Rome2Rio** | Multi-modal route search | Best for "how do I get from A to B" across train/bus/ferry/flight, great for multi-city trips | Not an itinerary/booking manager — a routing search engine only |
| **PackPoint** | Packing-list generator | Generates a packing list from destination, trip length, planned activities, and weather forecast | Single-purpose, no itinerary/booking/budget features |
| **TravelSpend** | Dedicated expense tracker | Per-expense category + payment method + local currency, auto-converts to home currency | No itinerary or booking management at all |
| **TripAdvisor Trips** | Destination research + light planning | Deep place/review research folded into a trip planner | Weaker as a dedicated planner than Wanderlog/TripIt |

**Takeaway:** the market splits into two models — *automatic organizers* (TripIt, Google Trips: parse bookings, weak on planning) and *active planners* (Wanderlog, Sygic, Roadtrippers: build itinerary/route, weak on auto-import). No single app in this vault's target use case (personal + Obsidian-integrated) needs to do everything the big apps do — it needs to cover the 20% used daily while living inside notes.

## Existing Obsidian plugins (direct prior art)

| Plugin | Model | Features | Relevance |
|---|---|---|---|
| **Travel Planner** (official community plugin, `community.obsidian.md/plugins/travel-planner`) | Plugin generates a main trip note + linked sub-notes | Itineraries, packing lists, accommodation notes, destination pages; sidebar groups trips by current/upcoming/past; "Add Itinerary Day" command; pre-populated categorised packing checklist; per-vault configurable trip folder; desktop + mobile, Obsidian 1.4.0+, MIT license, v1.0.1 | Closest direct competitor — already ships nearly the same MVP feature set this doc proposes. Worth installing and trying before building further, to avoid duplicating a solved problem. |
| **Obsidian Travel Planner** (vault template, not a plugin — `Modified9572/obsidian-travel-planner` on Codeberg) | A pre-built vault structure (`YYYY-<TripName>` folders with city subfolders for Places/Food & Drinks), not code | Interactive maps via Map View plugin, auto-updating itineraries by date/time, cross-folder task aggregation via Dataview/Tasks, flight/hotel/event/transit templates | Depends on 7 required + 12 recommended community plugins (Dataview, Map View, Meta Bind, Tasks, List Callouts, a sync mechanism, etc.) — heavier setup, but shows a proven note/folder schema and plugin-composition approach worth borrowing from. |
| **Itinerary** (`obsidian-itinerary`) | Renders a calendar from event data embedded in notes via code blocks | Monthly/weekly/daily/list calendar views, tag-based filtering and coloring, timezone support per event (useful for flight departure/arrival across zones) | Solves just the "visualize my schedule" slice — could be a dependency/inspiration for this plugin's itinerary view instead of building calendar rendering from scratch. |
| **Obsidian Travel Vault** (Gumroad template product) | Paid vault template, not a plugin | Pre-built trip note structure sold as a product | Signals there's a market for this even as a static template — validates demand, not architecture. |

**Implication:** before writing code, install and trial the official **Travel Planner** plugin — if it already covers packing lists, itinerary days, and accommodation notes adequately, the differentiated work here is narrower than the MVP list below suggests (e.g. focus on budget tracking, map view, or booking import, which it doesn't appear to have).

## Goals for this app

Given it will ship as an Obsidian plugin (source built separately, deployed into `.obsidian/plugins/`, similar to `obsidian-notifier` and `obsidian-azure-devops`), the app's edge over the incumbents is **owning the plan as vault-native notes** — itinerary, packing lists, and bookings as Markdown with frontmatter, not locked in someone else's cloud.

## Requirements

### Must have (MVP)
- **Trip note structure**: a trip is a note (or note folder) with frontmatter (`destination`, `start_date`, `end_date`, `status`) plus a day-by-day itinerary section.
- **Day-by-day itinerary editor**: add/reorder/remove stops (activity, time, location, notes) per day.
- **Manual booking entries**: flights, hotels, car rentals, activities — structured fields (confirmation #, times, location) stored in frontmatter or a fenced block, similar to how `obsidian-azure-devops` fences its sync block.
- **Packing list**: reusable/templated checklist per trip (the vault already has `10 Personal/Mitnahme/Items/` — this should plug into or replace that pattern). **Being built first — see [`packing-list/requirements.md`](packing-list/requirements.md) for the detailed spec.**
- **Budget tracking**: per-trip expense log with categories and running total; multi-currency aware.
- **Local-first storage**: everything as plain Markdown/YAML in the vault — works offline by default, syncs via the vault's existing git-based backup.

### Should have
- **Map view**: render itinerary stops on a map (day-by-day or whole-trip), similar to Wanderlog's route view.
- **Route optimization**: suggest a better stop order for a given day based on location.
- **Email/confirmation import**: paste or forward a confirmation email/PDF and auto-extract booking fields (TripIt's core value) — even a manual "paste text, parse fields" helper would cover most of the value.
- **Collaboration**: since Obsidian vaults are typically single-user, "collaboration" likely means export/share a read-only itinerary (e.g. rendered Markdown or a shareable link) rather than real-time multi-editor.
- **Notifications/reminders**: day-of reminders for upcoming stops or bookings — could reuse the existing `obsidian-notifier` plugin's scheduling engine instead of building a new one.
- **Templates**: trip templates (weekend trip, international, road trip) to scaffold the note structure quickly.

### Nice to have
- **Offline maps**: download map tiles for a destination (Sygic-style) — lower priority since Obsidian is a desktop-first, already-offline note tool.
- **Points/miles tracking**: loyalty program balances, redemption tracking (TripIt Pro feature).
- **AI trip assistant**: natural-language "plan me 3 days in Lisbon" trip-draft generation.
- **Expense splitting**: group cost splitting (Splitwise-style) — only relevant if trips are ever shared with co-travelers.
- **Calendar sync**: push itinerary items to system/Google calendar.

### Explicitly out of scope (for now)
- Real-time multi-user editing (Obsidian vaults are single-writer; sync is git-based, not live).
- Flight-status/alert polling that requires a always-on backend — no server component planned.
- Mobile-only features (this is a desktop Obsidian plugin, matching the constraint already documented for `obsidian-notifier`/`obsidian-azure-devops`).

## Open questions
- Should bookings/itinerary sync *into* the vault only, or should there also be an export (PDF/shareable link) for use while traveling without a laptop?
- Does packing-list logic get built fresh, or should the existing `10 Personal/Mitnahme/Items/` notes be adopted as the packing-list backend?
- Is there an appetite for reusing `obsidian-notifier`'s scheduling code for day-of reminders, or should this plugin be fully standalone?

## Sources
- [Best Travel Planning Apps in 2026: Wanderlog vs TripIt & More](https://blueplanit.co/blog/best-travel-planning-apps-thorough-reviews-of-tripadvisor-travel-mapper)
- [Wanderlog vs TripIt: Which Travel Planning App Is Better in 2026?](https://blueplanit.co/blog/wanderlog-vs-tripit)
- [Wanderlog vs TripIt 2026: Real Verdict After 3 Months Testing](https://tripstone.app/blog/wanderlog-vs-tripit)
- [Best TripIt Alternatives 2026: 8 Apps I Switched to After 3 Years](https://tripstone.app/blog/tripit-alternatives)
- [Google Trips Is Dead: 9 Better Alternatives in 2026 (Free + AI)](https://tripstone.app/blog/google-trips-alternatives)
- [TripIt vs. Roadtrippers Comparison](https://www.wandrly.app/comparisons/tripit-vs-roadtrippers)
- [TripIt vs Wanderlog vs Google Trips (2026 Compared)](https://monkeyeatingmango.com/blog/tripit-vs-wanderlog-vs-google-trips-2026/)
- [Best Travel Planning Apps 2026: Top 7 Picks Compared](https://www.stippl.io/blog/best-travel-planning-apps-2026)
- [Travel Planner — Obsidian community plugin](https://community.obsidian.md/plugins/travel-planner)
- [Obsidian Travel Planner — your offline trip planner (forum)](https://forum.obsidian.md/t/obsidian-travel-planner-your-offline-trip-planner/100934)
- [Itinerary plugin — obsidianstats.com](https://www.obsidianstats.com/plugins/obsidian-itinerary)
- [Obsidian plugins tagged #trip-planning](https://www.obsidianstats.com/tags/trip-planning)
