export interface PackingCatalogItem {
	name: string;
	categories: string[];
}

/** Seed data shape for "Create Example Data": a catalog item plus a demo starting quantity. */
export interface ExampleCatalogItem extends PackingCatalogItem {
	quantity: number;
}

/** A configured category: its display name and its user-chosen (or auto-assigned) color. */
export interface CategoryConfig {
	name: string;
	color: string;
}

/** A packing-status column (e.g. Packed, Bought) shown in a trip's packing table. */
export interface PackingColumn {
	key: string;
	label: string;
	type: "boolean" | "number";
}

export interface PackingListSettings {
	categories: CategoryConfig[];
	tripsFolder: string;
	catalogFolder: string;
	packingColumns: PackingColumn[];
}
