import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORY_NAMES, EXAMPLE_CATALOG_ITEMS } from "../src/constants";
import {
	buildCatalogBase,
	buildTripItemContent,
	buildTripPackingBase,
	categoryColor,
	formatCategoriesFrontmatter,
	mergeCategories,
	migrateCategoryConfigs,
	parseCatalogItems,
	parseCategoriesInput,
	sanitizeFilename,
	slugifyPropertyKey,
} from "../src/packing-list";
import type { CategoryConfig, PackingColumn } from "../src/types";

describe("parseCatalogItems", () => {
	it("keeps only entries with a string name and at least one valid category, sorted by name", () => {
		const items = parseCatalogItems([
			{ name: "Sunscreen", category: "hygiene" },
			{ name: "Passport", category: "general" },
			{ name: undefined, category: "general" },
			{ name: "No category", category: undefined },
			{ name: 42, category: "general" },
		]);

		expect(items).toEqual([
			{ name: "Passport", categories: ["general"] },
			{ name: "Sunscreen", categories: ["hygiene"] },
		]);
	});

	it("accepts a list of categories and dedupes/trims them", () => {
		const items = parseCatalogItems([{ name: "Swimsuit", category: ["Clothing", " Camping ", "Clothing"] }]);

		expect(items).toEqual([{ name: "Swimsuit", categories: ["Clothing", "Camping"] }]);
	});

	it("dedupes by name case-insensitively, keeping the first occurrence", () => {
		const items = parseCatalogItems([
			{ name: "Socks", category: "clothing" },
			{ name: "socks", category: "sport" },
		]);

		expect(items).toEqual([{ name: "Socks", categories: ["clothing"] }]);
	});
});

describe("parseCategoriesInput", () => {
	it("splits comma-separated text into a trimmed, deduped list", () => {
		expect(parseCategoriesInput("Clothing, Sport , Clothing")).toEqual(["Clothing", "Sport"]);
	});

	it("returns an empty list for blank input", () => {
		expect(parseCategoriesInput(" , ,")).toEqual([]);
	});
});

describe("formatCategoriesFrontmatter", () => {
	it("writes a single category as a bare scalar", () => {
		expect(formatCategoriesFrontmatter("category", ["Clothing"])).toBe("category: Clothing");
	});

	it("writes multiple categories as a YAML list", () => {
		expect(formatCategoriesFrontmatter("category", ["Clothing", "Sport"])).toBe(
			"category:\n  - Clothing\n  - Sport",
		);
	});
});

describe("mergeCategories", () => {
	const configured: CategoryConfig[] = [
		{ name: "general", color: "#111111" },
		{ name: "hygiene", color: "#222222" },
	];

	it("preserves configured order and colors, appending missing catalog categories, sorted", () => {
		const merged = mergeCategories(configured, [
			{ name: "Tent", categories: ["camping"] },
			{ name: "Passport", categories: ["general"] },
			{ name: "Rope", categories: ["abenteuer"] },
			{ name: "Swimsuit", categories: ["camping", "sport"] },
		]);

		expect(merged.map((c) => c.name)).toEqual(["general", "hygiene", "abenteuer", "camping", "sport"]);
		expect(merged[0]).toEqual({ name: "general", color: "#111111" });
		expect(merged[1]).toEqual({ name: "hygiene", color: "#222222" });
	});

	it("assigns a computed color to newly discovered categories", () => {
		const merged = mergeCategories(configured, [{ name: "Rope", categories: ["abenteuer"] }]);
		const extra = merged.find((c) => c.name === "abenteuer");

		expect(extra?.color).toBe(categoryColor("abenteuer"));
	});

	it("returns the configured list unchanged when the catalog is empty", () => {
		expect(mergeCategories(configured, [])).toEqual(configured);
	});
});

describe("sanitizeFilename", () => {
	it("replaces filesystem-illegal characters", () => {
		expect(sanitizeFilename('Passport: EU/US "backup"')).toBe("Passport- EU-US -backup-");
	});
});

describe("migrateCategoryConfigs", () => {
	it("converts plain category name strings (the pre-color-picker format) into CategoryConfig objects", () => {
		expect(migrateCategoryConfigs(["Clothing", "Sport"])).toEqual([
			{ name: "Clothing", color: categoryColor("Clothing") },
			{ name: "Sport", color: categoryColor("Sport") },
		]);
	});

	it("leaves already-migrated CategoryConfig objects untouched", () => {
		const config = [{ name: "Clothing", color: "#123456" }];
		expect(migrateCategoryConfigs(config)).toEqual(config);
	});

	it("returns undefined for non-array input, so the caller can tell there was nothing to migrate", () => {
		expect(migrateCategoryConfigs(undefined)).toBeUndefined();
		expect(migrateCategoryConfigs("not an array")).toBeUndefined();
	});
});

describe("categoryColor", () => {
	it("is deterministic for the same category name", () => {
		expect(categoryColor("Clothing")).toBe(categoryColor("Clothing"));
	});

	it("returns a 6-digit hex color, ready for Obsidian's color picker", () => {
		expect(categoryColor("Clothing")).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("differs for different category names (in practice, not guaranteed)", () => {
		expect(categoryColor("Clothing")).not.toBe(categoryColor("Electronics"));
	});
});

describe("buildCatalogBase", () => {
	it("filters on the catalog folder and uses the configured frontmatter field names", () => {
		const base = buildCatalogBase("Packing Catalog", ["general", "hygiene"], "artikel", "kategorie");

		expect(base).toContain('file.folder == "Packing Catalog"');
		expect(base).toContain("artikel:");
		expect(base).toContain("kategorie:");
	});

	it("adds one view per category, filtered with list().contains() so both scalar and list values match", () => {
		const base = buildCatalogBase("Items", ["general", "hygiene"], "name", "category");

		expect(base).toContain("name: general");
		expect(base).toContain('list(category).contains("general")');
		expect(base).toContain("name: hygiene");
		expect(base).toContain('list(category).contains("hygiene")');
	});

	it("sorts the All Items view by name rather than the (possibly multi-valued) category field", () => {
		const base = buildCatalogBase("Items", ["general"], "name", "category");
		expect(base).toContain("- property: name\n        direction: ASC");
	});
});

describe("slugifyPropertyKey", () => {
	it("lowercases and hyphenates a label into a frontmatter-safe key", () => {
		expect(slugifyPropertyKey("Needs Repair")).toBe("needs-repair");
	});

	it("strips characters outside a-z0-9 and trims leading/trailing hyphens", () => {
		expect(slugifyPropertyKey(" Bought! ")).toBe("bought");
	});
});

describe("buildTripItemContent", () => {
	const columns: PackingColumn[] = [
		{ key: "packed", label: "Packed", type: "number" },
		{ key: "bought", label: "Bought", type: "boolean" },
	];

	it("writes the category (bare scalar for one), a default quantity of 1, and each column at its type's zero value", () => {
		const content = buildTripItemContent("category", ["Clothing"], columns);

		expect(content).toBe("---\ncategory: Clothing\nquantity: 1\npacked: 0\nbought: false\n---\n");
	});

	it("writes multiple categories as a YAML list", () => {
		const content = buildTripItemContent("category", ["Clothing", "Sport"], columns);

		expect(content).toContain("category:\n  - Clothing\n  - Sport");
		expect(content).toContain("quantity: 1");
		expect(content).toContain("packed: 0");
		expect(content).toContain("bought: false");
	});

	it("zeroes a number column to 0 and a boolean column to false regardless of order", () => {
		const numberFirst: PackingColumn[] = [{ key: "needsRepair", label: "Needs Repair", type: "number" }];
		expect(buildTripItemContent("category", ["Clothing"], numberFirst)).toContain("needsRepair: 0");

		const booleanColumn: PackingColumn[] = [{ key: "washed", label: "Washed", type: "boolean" }];
		expect(buildTripItemContent("category", ["Clothing"], booleanColumn)).toContain("washed: false");
	});

	it("accepts a custom starting quantity instead of the default 1", () => {
		const content = buildTripItemContent("category", ["Clothing"], columns, 5);
		expect(content).toContain("quantity: 5");
	});
});

describe("buildTripPackingBase", () => {
	const columns: PackingColumn[] = [
		{ key: "packed", label: "Packed", type: "number" },
		{ key: "bought", label: "Bought", type: "boolean" },
	];

	it("filters on the trip's items folder and declares file name, category, quantity, and each column as properties", () => {
		const base = buildTripPackingBase("Trips/Lisbon 2026/items", "category", columns);

		expect(base).toContain('file.folder == "Trips/Lisbon 2026/items"');
		expect(base).toContain("file.name:\n    displayName: Name");
		expect(base).toContain("category:\n    displayName: Category");
		expect(base).toContain("quantity:\n    displayName: Quantity");
		expect(base).toContain("packed:\n    displayName: Packed");
		expect(base).toContain("bought:\n    displayName: Bought");
	});

	it("orders the single table view as file name, then category, then quantity, then each configured column", () => {
		const base = buildTripPackingBase("items", "category", columns);
		const order = base.split("order:\n")[1]?.split("sort:")[0];

		expect(order).toContain("- file.name");
		expect(order?.indexOf("- file.name")).toBeLessThan(order?.indexOf("- category") ?? -1);
		expect(order?.indexOf("- category")).toBeLessThan(order?.indexOf("- quantity") ?? -1);
		expect(order?.indexOf("- quantity")).toBeLessThan(order?.indexOf("- packed") ?? -1);
		expect(order?.indexOf("- packed")).toBeLessThan(order?.indexOf("- bought") ?? -1);
	});
});

describe("EXAMPLE_CATALOG_ITEMS", () => {
	it('covers every default category with at least one item, so "Create Example Data" never leaves a category empty', () => {
		const covered = new Set(EXAMPLE_CATALOG_ITEMS.flatMap((item) => item.categories));
		const missing = DEFAULT_CATEGORY_NAMES.filter((name) => !covered.has(name));

		expect(missing).toEqual([]);
	});

	it('has at least one item with a quantity other than 1, so the demo isn\'t uniformly "1 of everything"', () => {
		expect(EXAMPLE_CATALOG_ITEMS.some((item) => item.quantity !== 1)).toBe(true);
	});
});
