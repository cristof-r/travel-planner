import type { CategoryConfig, PackingCatalogItem, PackingColumn } from "./types";

export interface CatalogFrontmatterEntry {
	name: unknown;
	category: unknown;
}

/**
 * Normalizes a raw frontmatter value into a deduped list of trimmed category names.
 * Accepts either a bare scalar (single category, the existing single-category note format)
 * or a list (multiple categories); non-string entries and blanks are dropped.
 */
function normalizeCategories(value: unknown): string[] {
	const raw = Array.isArray(value) ? value : [value];
	const seen = new Set<string>();
	const categories: string[] = [];

	for (const entry of raw) {
		if (typeof entry !== "string") continue;
		const trimmed = entry.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		categories.push(trimmed);
	}

	return categories;
}

/**
 * Turns raw frontmatter values read from a folder of item notes into catalog items.
 * Entries missing a name, or with no valid categories, are skipped; duplicate names
 * (case-insensitive) are deduped, keeping the first occurrence.
 */
export function parseCatalogItems(entries: CatalogFrontmatterEntry[]): PackingCatalogItem[] {
	const items: PackingCatalogItem[] = [];
	const seen = new Set<string>();

	for (const entry of entries) {
		if (typeof entry.name !== "string") continue;
		const name = entry.name.trim();
		if (!name) continue;

		const categories = normalizeCategories(entry.category);
		if (categories.length === 0) continue;

		const key = name.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		items.push({ name, categories });
	}

	return items.sort((a, b) => a.name.localeCompare(b.name));
}

/** Parses comma-separated free text (e.g. "Clothing, Sport") into a deduped category list. */
export function parseCategoriesInput(raw: string): string[] {
	return normalizeCategories(raw.split(","));
}

/**
 * Formats a catalog item's categories as YAML frontmatter: a bare scalar for a single
 * category (matching the existing single-category note format), a list for multiple.
 */
export function formatCategoriesFrontmatter(categoryField: string, categories: string[]): string {
	if (categories.length <= 1) {
		return `${categoryField}: ${categories[0] ?? ""}`;
	}

	const lines = [`${categoryField}:`];
	for (const category of categories) {
		lines.push(`  - ${category}`);
	}
	return lines.join("\n");
}

/**
 * Appends any categories present in the catalog but missing from the configured, ordered
 * category list, so a stale settings list never silently hides items. New entries get a
 * computed default color; existing entries (and any color the user already chose) are untouched.
 */
export function mergeCategories(configured: CategoryConfig[], catalog: PackingCatalogItem[]): CategoryConfig[] {
	const merged = [...configured];
	const known = new Set(merged.map((c) => c.name));
	const extras = Array.from(new Set(catalog.flatMap((item) => item.categories))).sort();

	for (const name of extras) {
		if (known.has(name)) continue;
		merged.push({ name, color: categoryColor(name) });
		known.add(name);
	}

	return merged;
}

export function sanitizeFilename(name: string): string {
	return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

/** Derives a frontmatter-safe property key from a column label, e.g. "Needs Repair" -> "needs-repair". */
export function slugifyPropertyKey(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** Frontmatter key for how many of an item a trip needs — always present, not a configurable column. */
export const QUANTITY_FIELD = "quantity";

function zeroValueFor(column: PackingColumn): string {
	return column.type === "number" ? "0" : "false";
}

/**
 * Frontmatter for a per-trip item note: its category (or categories), a target quantity
 * (defaulting to 1, manually adjustable per trip), and one packing-status column per
 * configured column, each starting at its type's zero value (`0` or `false`).
 */
export function buildTripItemContent(
	categoryField: string,
	categories: string[],
	columns: PackingColumn[],
	quantity = 1,
): string {
	const lines = ["---", formatCategoriesFrontmatter(categoryField, categories), `${QUANTITY_FIELD}: ${quantity}`];
	for (const column of columns) {
		lines.push(`${column.key}: ${zeroValueFor(column)}`);
	}
	lines.push("---", "");
	return lines.join("\n");
}

/**
 * Generates the per-trip Bases (`.base`) file that turns a folder of per-item notes into a live,
 * genuinely interactive table: Bases renders boolean properties as clickable checkboxes and number
 * properties as inline-editable cells, so ticking "Packed"/"Bought" or entering a packed count
 * updates the underlying note's frontmatter directly — unlike a Markdown table, which can't hold
 * interactive cells at all.
 */
export function buildTripPackingBase(itemsFolder: string, categoryField: string, columns: PackingColumn[]): string {
	const lines: string[] = [
		"filters:",
		"  and:",
		`    - file.folder == "${itemsFolder}"`,
		"properties:",
		"  file.name:",
		"    displayName: Name",
		`  ${categoryField}:`,
		"    displayName: Category",
		`  ${QUANTITY_FIELD}:`,
		"    displayName: Quantity",
	];

	for (const column of columns) {
		lines.push(`  ${column.key}:`, `    displayName: ${column.label}`);
	}

	lines.push(
		"views:",
		"  - type: table",
		"    name: Packing List",
		"    order:",
		"      - file.name",
		`      - ${categoryField}`,
		`      - ${QUANTITY_FIELD}`,
	);
	for (const column of columns) {
		lines.push(`      - ${column.key}`);
	}
	lines.push("    sort:", `      - property: ${categoryField}`, "        direction: ASC");

	return lines.join("\n") + "\n";
}

/**
 * Upgrades a `categories` setting saved by a pre-color-picker version of the plugin (a plain
 * array of name strings) into the current `CategoryConfig[]` shape, assigning each a computed
 * default color. Already-migrated entries are passed through untouched. Returns `undefined` for
 * anything that isn't an array, so the caller can tell "nothing to migrate" apart from "empty".
 */
export function migrateCategoryConfigs(raw: unknown): CategoryConfig[] | undefined {
	if (!Array.isArray(raw)) return undefined;

	return raw.map((entry) =>
		typeof entry === "string" ? { name: entry, color: categoryColor(entry) } : (entry as CategoryConfig),
	);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
	const s = saturation / 100;
	const l = lightness / 100;
	const k = (n: number) => (n + hue / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const toHex = (x: number) =>
		Math.round(255 * x)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Deterministic default color for a category name (a hex string, ready for Obsidian's
 * ColorComponent), so a brand-new category starts out with a sensible swatch before the
 * user picks their own. Same name always produces the same color, nothing stored.
 */
export function categoryColor(category: string): string {
	let hash = 0;
	for (let i = 0; i < category.length; i++) {
		hash = (hash * 31 + category.charCodeAt(i)) | 0;
	}
	const hue = Math.abs(hash) % 360;
	return hslToHex(hue, 65, 50);
}

/**
 * Generates an Obsidian Bases (`.base`) file: a live, filterable table over the catalog
 * folder — one view per category plus an "All Items" view — using the vault's own
 * frontmatter field names so it stays in sync with whatever the plugin is configured to read.
 * `list(...)` normalizes the category field so the filter matches whether a note has a single
 * bare category or a multi-category list.
 */
export function buildCatalogBase(
	catalogFolder: string,
	categories: string[],
	nameField: string,
	categoryField: string,
): string {
	const lines: string[] = [
		"filters:",
		"  and:",
		`    - file.folder == "${catalogFolder}"`,
		"properties:",
		`  ${nameField}:`,
		"    displayName: Name",
		`  ${categoryField}:`,
		"    displayName: Category",
		"views:",
		"  - type: table",
		"    name: All Items",
		"    order:",
		`      - ${nameField}`,
		`      - ${categoryField}`,
		"    sort:",
		`      - property: ${nameField}`,
		"        direction: ASC",
	];

	for (const category of categories) {
		lines.push(
			"  - type: table",
			`    name: ${category}`,
			"    order:",
			`      - ${nameField}`,
			"    filter:",
			"      and:",
			`        - list(${categoryField}).contains("${category}")`,
		);
	}

	return lines.join("\n") + "\n";
}
