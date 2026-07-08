import type { ExampleCatalogItem, PackingColumn } from "./types";

export const PACKING_LIST_HEADING = "## Packing List";

// Fixed, not configurable in Settings — namespaced so they don't collide with other
// plugins' frontmatter on the same notes.
export const CATALOG_NAME_FIELD = "travel-planner-name";
export const CATALOG_CATEGORY_FIELD = "travel-planner-category";

export const DEFAULT_PACKING_COLUMNS: PackingColumn[] = [
	{ key: "packed", label: "Packed", type: "number" },
	{ key: "bought", label: "Bought", type: "boolean" },
];

// Colors are computed (via categoryColor()) rather than assigned here, in settings.ts,
// to avoid a circular import (packing-list.ts already imports PACKING_LIST_HEADING from here).
export const DEFAULT_CATEGORY_NAMES: string[] = [
	"Clothing",
	"Footwear",
	"Toiletries",
	"Health & Medication",
	"Electronics",
	"Documents & Money",
	"Sports",
	"Camping",
	"Backpacking",
	"Concerts",
	"Festivals",
	"Activity-Specific Gear",
	"Transport",
	"Transit Comfort",
	"Carry-On",
	"Checked",
	"Climate-Dependent",
	"Climate-Independent",
	"Work & Business",
	"General",
	"Miscellaneous",
];

// Seed data for the "Create Example Data" command — at least one item per default category
// (keep in sync with DEFAULT_CATEGORY_NAMES above), with varied quantities so the packing
// table isn't uniformly "1 of everything". Toiletry Bag and Sunglasses each demonstrate an
// item belonging to more than one category.
export const EXAMPLE_CATALOG_ITEMS: ExampleCatalogItem[] = [
	{ name: "Underwear", categories: ["Clothing"], quantity: 5 },
	{ name: "Socks", categories: ["Clothing"], quantity: 5 },
	{ name: "T-Shirt", categories: ["Clothing"], quantity: 4 },
	{ name: "Sneakers", categories: ["Footwear"], quantity: 1 },
	{ name: "Toothbrush", categories: ["Toiletries"], quantity: 1 },
	{ name: "Sunscreen", categories: ["Toiletries"], quantity: 1 },
	{ name: "Toiletry Bag", categories: ["Toiletries", "Carry-On"], quantity: 1 },
	{ name: "First Aid Kit", categories: ["Health & Medication"], quantity: 1 },
	{ name: "Pain Relievers", categories: ["Health & Medication"], quantity: 1 },
	{ name: "Phone Charger", categories: ["Electronics"], quantity: 1 },
	{ name: "Power Bank", categories: ["Electronics"], quantity: 1 },
	{ name: "Passport", categories: ["Documents & Money"], quantity: 1 },
	{ name: "Wallet", categories: ["Documents & Money"], quantity: 1 },
	{ name: "Resistance Band", categories: ["Sports"], quantity: 1 },
	{ name: "Tent", categories: ["Camping"], quantity: 1 },
	{ name: "Backpack Rain Cover", categories: ["Backpacking"], quantity: 1 },
	{ name: "Earplugs", categories: ["Concerts"], quantity: 2 },
	{ name: "Poncho", categories: ["Festivals"], quantity: 1 },
	{ name: "Snorkel Set", categories: ["Activity-Specific Gear"], quantity: 1 },
	{ name: "Luggage Tag", categories: ["Transport"], quantity: 2 },
	{ name: "Neck Pillow", categories: ["Transit Comfort"], quantity: 1 },
	{ name: "Eye Mask", categories: ["Transit Comfort"], quantity: 1 },
	{ name: "Packing Cubes", categories: ["Checked"], quantity: 3 },
	{ name: "Rain Jacket", categories: ["Climate-Dependent"], quantity: 1 },
	{ name: "Multi-Tool", categories: ["Climate-Independent"], quantity: 1 },
	{ name: "Laptop", categories: ["Work & Business"], quantity: 1 },
	{ name: "Business Cards", categories: ["Work & Business"], quantity: 20 },
	{ name: "Reusable Water Bottle", categories: ["General"], quantity: 1 },
	{ name: "Sunglasses", categories: ["Miscellaneous", "General"], quantity: 1 },
];

// Trip note frontmatter (trip/destination/start_date/end_date) is hardcoded in main.ts's
// createTrip(), so this template can be a plain constant rather than a generated function.
export const TRIPS_BASE_CONTENT = `filters:
  and:
    - trip == true
properties:
  destination:
    displayName: Destination
  start_date:
    displayName: Start Date
  end_date:
    displayName: End Date
views:
  - type: table
    name: All Trips
    order:
      - destination
      - start_date
      - end_date
    sort:
      - property: start_date
        direction: ASC
`;
