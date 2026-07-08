import { AbstractInputSuggest, App, Modal, Notice, Plugin, TFile, TFolder, normalizePath } from "obsidian";
import {
	CATALOG_CATEGORY_FIELD,
	CATALOG_NAME_FIELD,
	EXAMPLE_CATALOG_ITEMS,
	PACKING_LIST_HEADING,
	TRIPS_BASE_CONTENT,
} from "./constants";
import { t } from "./i18n";
import {
	buildCatalogBase,
	buildTripItemContent,
	buildTripPackingBase,
	formatCategoriesFrontmatter,
	mergeCategories,
	migrateCategoryConfigs,
	parseCatalogItems,
	parseCategoriesInput,
	sanitizeFilename,
} from "./packing-list";
import { DEFAULT_SETTINGS, TravelPlannerSettingTab } from "./settings";
import type { CategoryConfig, PackingCatalogItem, PackingListSettings } from "./types";
import { appendCategoryDot } from "./ui";

interface TripPaths {
	tripDir: string;
	noteFile: string;
	itemsDir: string;
	baseFile: string;
}

export default class TravelPlannerPlugin extends Plugin {
	settings: PackingListSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "create-trip",
			name: t("command.createTrip"),
			callback: () => this.createTrip(),
		});

		this.addCommand({
			id: "insert-packing-list",
			name: t("command.insertPackingList"),
			callback: () => this.insertPackingList(),
		});

		this.addCommand({
			id: "reset-packing-list",
			name: t("command.resetPackingList"),
			callback: () => this.resetCurrentPackingList(),
		});

		this.addCommand({
			id: "create-packing-item",
			name: t("command.createPackingItem"),
			callback: () => this.createPackingItem(),
		});

		this.addCommand({
			id: "create-trips-overview",
			name: t("command.createTripsOverview"),
			callback: () => this.createTripsOverview(),
		});

		this.addCommand({
			id: "create-catalog-overview",
			name: t("command.createCatalogOverview"),
			callback: () => this.createCatalogOverview(),
		});

		this.addCommand({
			id: "create-example-data",
			name: t("command.createExampleData"),
			callback: () => this.createExampleData(),
		});

		this.addSettingTab(new TravelPlannerSettingTab(this.app, this));
	}

	onunload() {
		// Commands and the setting tab are torn down automatically by the Plugin base class.
		// Nothing else here holds a resource (interval, listener, connection) that needs releasing.
	}

	async loadSettings() {
		const raw = ((await this.loadData()) as Record<string, unknown> | null) ?? {};

		const migratedCategories = migrateCategoryConfigs(raw.categories);
		if (migratedCategories) raw.categories = migratedCategories;

		this.settings = Object.assign({}, DEFAULT_SETTINGS, raw) as PackingListSettings;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private isTripsConfigured(): boolean {
		return Boolean(this.settings.tripsFolder);
	}

	private isCatalogConfigured(): boolean {
		return Boolean(this.settings.catalogFolder);
	}

	private getCatalog(): PackingCatalogItem[] {
		if (!this.isCatalogConfigured()) return [];

		const folder = this.app.vault.getAbstractFileByPath(normalizePath(this.settings.catalogFolder));
		if (!(folder instanceof TFolder)) return [];

		const entries = folder.children
			.filter((f): f is TFile => f instanceof TFile && f.extension === "md")
			.map((f) => {
				const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
				return { name: fm?.[CATALOG_NAME_FIELD], category: fm?.[CATALOG_CATEGORY_FIELD] };
			});

		return parseCatalogItems(entries);
	}

	/** Vault paths for a trip's note, its per-item packing-status notes, and its generated Base. */
	private tripPaths(rootFolder: string, tripName: string): TripPaths {
		const tripDir = normalizePath(`${rootFolder}/${tripName}`);
		return {
			tripDir,
			noteFile: normalizePath(`${tripDir}/${tripName}.md`),
			itemsDir: normalizePath(`${tripDir}/items`),
			baseFile: normalizePath(`${tripDir}/Packing.base`),
		};
	}

	/**
	 * Creates one per-trip item note per catalog item (skipping any that already exist there).
	 * `quantityFor` defaults every item to a quantity of 1; `createExampleData` overrides it to
	 * demo varied quantities instead of "1 of everything".
	 */
	private async createTripItemNotes(
		itemsDir: string,
		items: PackingCatalogItem[],
		quantityFor: (item: PackingCatalogItem) => number = () => 1,
	): Promise<void> {
		await this.ensureFolderExists(itemsDir);

		for (const item of items) {
			const itemPath = normalizePath(`${itemsDir}/${sanitizeFilename(item.name)}.md`);
			if (this.app.vault.getAbstractFileByPath(itemPath)) continue;

			const content = buildTripItemContent(
				CATALOG_CATEGORY_FIELD,
				item.categories,
				this.settings.packingColumns,
				quantityFor(item),
			);
			await this.app.vault.create(itemPath, content);
		}
	}

	/** Creates the per-trip packing table Base, if one doesn't already exist there. */
	private async createTripBase(baseFile: string, itemsDir: string): Promise<void> {
		if (this.app.vault.getAbstractFileByPath(baseFile)) return;

		const content = buildTripPackingBase(itemsDir, CATALOG_CATEGORY_FIELD, this.settings.packingColumns);
		await this.app.vault.create(baseFile, content);
	}

	private async createTrip() {
		if (!this.isTripsConfigured()) {
			new Notice(t("notice.tripsFolderNotConfigured"));
			return;
		}

		const name = await this.promptForText(
			t("modal.tripName.title"),
			t("modal.tripName.placeholder"),
			t("modal.tripName.button"),
		);
		if (!name) return;

		const paths = this.tripPaths(this.settings.tripsFolder, name);

		if (this.app.vault.getAbstractFileByPath(paths.noteFile)) {
			new Notice(t("notice.tripExists", { name, folder: this.settings.tripsFolder }));
			return;
		}

		const catalog = this.getCatalog();
		const categories = mergeCategories(this.settings.categories, catalog);
		const selected = await this.pickCategories(categories);
		if (!selected) return;

		const selectedSet = new Set(selected);
		const items = catalog.filter((item) => item.categories.some((c) => selectedSet.has(c)));

		await this.createTripItemNotes(paths.itemsDir, items);
		await this.createTripBase(paths.baseFile, paths.itemsDir);

		const content = [
			"---",
			"trip: true",
			'destination: ""',
			'start_date: ""',
			'end_date: ""',
			"---",
			"",
			PACKING_LIST_HEADING,
			"",
			`![[${paths.baseFile}]]`,
			"",
		].join("\n");

		const file = await this.app.vault.create(paths.noteFile, content);
		await this.app.workspace.getLeaf("tab").openFile(file);
		new Notice(t("notice.tripCreated", { name }));
	}

	private async insertPackingList() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice(t("notice.noActiveFile"));
			return;
		}

		const catalog = this.getCatalog();
		const categories = mergeCategories(this.settings.categories, catalog);
		const selected = await this.pickCategories(categories);
		if (!selected) return;

		const selectedSet = new Set(selected);
		const items = catalog.filter((item) => item.categories.some((c) => selectedSet.has(c)));

		const tripDir = file.parent?.path ?? "";
		const itemsDir = normalizePath(`${tripDir}/items`);
		const baseFile = normalizePath(`${tripDir}/Packing.base`);

		await this.createTripItemNotes(itemsDir, items);
		await this.createTripBase(baseFile, itemsDir);

		const embed = `![[${baseFile}]]`;
		const existing = await this.app.vault.read(file);
		if (!existing.includes(embed)) {
			await this.app.vault.modify(file, `${existing.trimEnd()}\n\n${PACKING_LIST_HEADING}\n\n${embed}\n`);
		}
		new Notice(t("notice.packingListInserted"));
	}

	private async resetCurrentPackingList() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice(t("notice.noActiveFile"));
			return;
		}

		const tripDir = file.parent?.path ?? "";
		const itemsDir = normalizePath(`${tripDir}/items`);
		const itemsFolder = this.app.vault.getAbstractFileByPath(itemsDir);

		if (!(itemsFolder instanceof TFolder)) {
			new Notice(t("notice.noPackingList"));
			return;
		}

		const itemFiles = itemsFolder.children.filter((f): f is TFile => f instanceof TFile && f.extension === "md");
		if (itemFiles.length === 0) {
			new Notice(t("notice.noPackingList"));
			return;
		}

		for (const itemFile of itemFiles) {
			await this.app.fileManager.processFrontMatter(itemFile, (fm) => {
				for (const column of this.settings.packingColumns) {
					fm[column.key] = column.type === "number" ? 0 : false;
				}
			});
		}

		new Notice(t("notice.packingListReset"));
	}

	private async createPackingItem() {
		if (!this.isCatalogConfigured()) {
			new Notice(t("notice.catalogNotConfigured"));
			return;
		}

		const name = await this.promptForText(
			t("modal.itemName.title"),
			t("modal.itemName.placeholder"),
			t("modal.itemName.button"),
		);
		if (!name) return;

		const catalog = this.getCatalog();
		const categories = mergeCategories(this.settings.categories, catalog);
		const categoriesInput = await this.promptForText(
			t("modal.category.title"),
			t("modal.category.placeholder"),
			t("modal.category.button"),
			categories,
		);
		if (!categoriesInput) return;

		const itemCategories = parseCategoriesInput(categoriesInput);
		if (itemCategories.length === 0) return;

		await this.ensureFolderExists(this.settings.catalogFolder);
		const filePath = normalizePath(`${this.settings.catalogFolder}/${sanitizeFilename(name)}.md`);

		if (this.app.vault.getAbstractFileByPath(filePath)) {
			new Notice(t("notice.itemExists", { name, folder: this.settings.catalogFolder }));
			return;
		}

		const content = [
			"---",
			`${CATALOG_NAME_FIELD}: ${name}`,
			formatCategoriesFrontmatter(CATALOG_CATEGORY_FIELD, itemCategories),
			"---",
			"",
		].join("\n");

		await this.app.vault.create(filePath, content);
		new Notice(t("notice.itemAdded", { name }));
	}

	private async createTripsOverview() {
		if (!this.isTripsConfigured()) {
			new Notice(t("notice.tripsFolderNotConfigured"));
			return;
		}

		await this.ensureFolderExists(this.settings.tripsFolder);
		const filePath = normalizePath(`${this.settings.tripsFolder}/Trips Overview.base`);

		if (this.app.vault.getAbstractFileByPath(filePath)) {
			new Notice(t("notice.tripsOverviewExists", { folder: this.settings.tripsFolder }));
			return;
		}

		const file = await this.app.vault.create(filePath, TRIPS_BASE_CONTENT);
		await this.app.workspace.getLeaf("tab").openFile(file);
		new Notice(t("notice.tripsOverviewCreated", { folder: this.settings.tripsFolder }));
	}

	private async createCatalogOverview() {
		if (!this.isCatalogConfigured()) {
			new Notice(t("notice.catalogNotConfigured"));
			return;
		}

		const catalog = this.getCatalog();
		const categories = mergeCategories(this.settings.categories, catalog);
		const categoryNames = categories.map((c) => c.name);

		await this.ensureFolderExists(this.settings.catalogFolder);
		const filePath = normalizePath(`${this.settings.catalogFolder}/Catalog Overview.base`);

		if (this.app.vault.getAbstractFileByPath(filePath)) {
			new Notice(t("notice.catalogOverviewExists", { folder: this.settings.catalogFolder }));
			return;
		}

		const content = buildCatalogBase(
			this.settings.catalogFolder,
			categoryNames,
			CATALOG_NAME_FIELD,
			CATALOG_CATEGORY_FIELD,
		);

		const file = await this.app.vault.create(filePath, content);
		await this.app.workspace.getLeaf("tab").openFile(file);
		new Notice(t("notice.catalogOverviewCreated", { folder: this.settings.catalogFolder }));
	}

	/** One-click demo: fills in any unset required settings, seeds a few catalog items, and creates a sample trip. */
	private async createExampleData() {
		let settingsChanged = false;
		if (!this.settings.tripsFolder) {
			this.settings.tripsFolder = DEFAULT_SETTINGS.tripsFolder;
			settingsChanged = true;
		}
		if (!this.settings.catalogFolder) {
			this.settings.catalogFolder = DEFAULT_SETTINGS.catalogFolder;
			settingsChanged = true;
		}
		if (settingsChanged) await this.saveSettings();

		await this.ensureFolderExists(this.settings.catalogFolder);

		let itemsCreated = 0;
		for (const item of EXAMPLE_CATALOG_ITEMS) {
			const filePath = normalizePath(`${this.settings.catalogFolder}/${sanitizeFilename(item.name)}.md`);
			if (this.app.vault.getAbstractFileByPath(filePath)) continue;

			const content = [
				"---",
				`${CATALOG_NAME_FIELD}: ${item.name}`,
				formatCategoriesFrontmatter(CATALOG_CATEGORY_FIELD, item.categories),
				"---",
				"",
			].join("\n");
			await this.app.vault.create(filePath, content);
			itemsCreated++;
		}

		const catalog = this.getCatalog();
		const paths = this.tripPaths(this.settings.tripsFolder, "Example Trip");

		if (!this.app.vault.getAbstractFileByPath(paths.noteFile)) {
			const exampleQuantities = new Map(EXAMPLE_CATALOG_ITEMS.map((item) => [item.name, item.quantity]));
			await this.createTripItemNotes(paths.itemsDir, catalog, (item) => exampleQuantities.get(item.name) ?? 1);
			await this.createTripBase(paths.baseFile, paths.itemsDir);

			const tripContent = [
				"---",
				"trip: true",
				'destination: "Lisbon"',
				'start_date: ""',
				'end_date: ""',
				"---",
				"",
				PACKING_LIST_HEADING,
				"",
				`![[${paths.baseFile}]]`,
				"",
			].join("\n");
			await this.app.vault.create(paths.noteFile, tripContent);
		}

		const tripFile = this.app.vault.getAbstractFileByPath(paths.noteFile);
		if (tripFile instanceof TFile) {
			await this.app.workspace.getLeaf("tab").openFile(tripFile);
		}

		new Notice(t("notice.exampleDataCreated", { items: itemsCreated }));
	}

	private pickCategories(categories: CategoryConfig[]): Promise<string[] | null> {
		return new Promise((resolve) => {
			const modal = new CategoryPickerModal(this.app, categories, resolve);
			modal.open();
		});
	}

	private promptForText(
		title: string,
		placeholder: string,
		buttonText: string,
		suggestions: CategoryConfig[] = [],
	): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new (class extends Modal {
				result: string | null = null;

				onOpen() {
					const { contentEl } = this;
					contentEl.createEl("h3", { text: title });

					const input = contentEl.createEl("input", { type: "text", placeholder });
					input.style.width = "100%";
					input.style.marginBottom = "1em";
					input.focus();

					// A native <datalist> would be simpler, but WebKit (iOS/mobile Obsidian) never
					// implemented its dropdown, so it silently offers no suggestions there — use
					// Obsidian's own suggest popover instead, which renders consistently everywhere.
					if (suggestions.length > 0) {
						new CommaListSuggest(this.app, input, suggestions);
					}

					input.addEventListener("keydown", (e: KeyboardEvent) => {
						if (e.key === "Enter") {
							this.result = input.value.trim();
							this.close();
						}
						if (e.key === "Escape") {
							this.close();
						}
					});

					const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
					const btn = btnContainer.createEl("button", { text: buttonText, cls: "mod-cta" });
					btn.addEventListener("click", () => {
						this.result = input.value.trim();
						this.close();
					});
				}

				onClose() {
					resolve(this.result);
				}
			})(this.app);

			modal.open();
		});
	}

	private async ensureFolderExists(path: string): Promise<void> {
		const parts = path.split("/");
		let current = "";
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}
}

class CategoryPickerModal extends Modal {
	private selected = new Set<string>();
	private onSubmit: (categories: string[] | null) => void;
	private categories: CategoryConfig[];
	private submitted = false;

	constructor(app: App, categories: CategoryConfig[], onSubmit: (categories: string[] | null) => void) {
		super(app);
		this.categories = categories;
		this.onSubmit = onSubmit;
		this.categories.forEach((c) => this.selected.add(c.name));
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: t("modal.categoryPicker.title") });

		for (const category of this.categories) {
			const label = contentEl.createEl("label");
			label.style.display = "flex";
			label.style.alignItems = "center";
			label.style.marginBottom = "0.5em";

			const checkbox = label.createEl("input", { type: "checkbox" });
			checkbox.checked = true;
			checkbox.style.marginRight = "0.5em";
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) this.selected.add(category.name);
				else this.selected.delete(category.name);
			});

			appendCategoryDot(label, category.color);
			label.appendText(category.name);
		}

		const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
		const btn = btnContainer.createEl("button", { text: t("modal.categoryPicker.button"), cls: "mod-cta" });
		btn.addEventListener("click", () => {
			this.submitted = true;
			this.close();
		});
	}

	onClose() {
		this.contentEl.empty();
		this.onSubmit(this.submitted ? Array.from(this.selected) : null);
	}
}

/**
 * Type-ahead suggestions for a comma-separated multi-value text input (e.g. "Clothing, Sport"),
 * working identically on desktop and mobile. Suggestions and selection only ever affect the
 * segment currently being typed, after the last comma — earlier confirmed values are untouched.
 */
class CommaListSuggest extends AbstractInputSuggest<CategoryConfig> {
	private inputEl: HTMLInputElement;
	private items: CategoryConfig[];

	constructor(app: App, inputEl: HTMLInputElement, items: CategoryConfig[]) {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.items = items;
	}

	private currentSegment(): { prefix: string; query: string } {
		const value = this.inputEl.value;
		const lastComma = value.lastIndexOf(",");
		const prefix = lastComma === -1 ? "" : `${value.slice(0, lastComma + 1)} `;
		const query = (lastComma === -1 ? value : value.slice(lastComma + 1)).trim().toLowerCase();
		return { prefix, query };
	}

	getSuggestions(_query: string): CategoryConfig[] {
		const { query } = this.currentSegment();
		if (!query) return this.items;
		return this.items.filter((item) => item.name.toLowerCase().includes(query));
	}

	renderSuggestion(value: CategoryConfig, el: HTMLElement): void {
		el.style.display = "flex";
		el.style.alignItems = "center";
		appendCategoryDot(el, value.color);
		el.createSpan({ text: value.name });
	}

	selectSuggestion(value: CategoryConfig): void {
		const { prefix } = this.currentSegment();
		this.inputEl.value = `${prefix}${value.name}, `;
		this.inputEl.trigger("input");
		this.close();
	}
}
