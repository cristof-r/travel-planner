import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_CATEGORY_NAMES, DEFAULT_PACKING_COLUMNS } from "./constants";
import { t } from "./i18n";
import { categoryColor, slugifyPropertyKey } from "./packing-list";
import type TravelPlannerPlugin from "./main";
import type { CategoryConfig, PackingColumn, PackingListSettings } from "./types";
import { appendCategoryDot } from "./ui";

export const DEFAULT_SETTINGS: PackingListSettings = {
	categories: DEFAULT_CATEGORY_NAMES.map((name) => ({ name, color: categoryColor(name) })),
	tripsFolder: "Trips",
	catalogFolder: "Trips/Packing Catalog",
	packingColumns: DEFAULT_PACKING_COLUMNS,
};

export class TravelPlannerSettingTab extends PluginSettingTab {
	plugin: TravelPlannerPlugin;

	constructor(app: App, plugin: TravelPlannerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: t("settings.title") });

		new Setting(containerEl)
			.setName(t("settings.tripsFolder.name"))
			.setDesc(t("settings.tripsFolder.desc"))
			.addText((comp) =>
				comp
					.setPlaceholder(DEFAULT_SETTINGS.tripsFolder)
					.setValue(this.plugin.settings.tripsFolder)
					.onChange(async (v) => {
						this.plugin.settings.tripsFolder = v.trim();
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl("h3", { text: t("settings.catalog.heading") });
		containerEl.createEl("p", {
			text: t("settings.catalog.desc"),
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName(t("settings.catalogFolder.name"))
			.setDesc(t("settings.catalogFolder.desc"))
			.addText((comp) =>
				comp
					.setPlaceholder(DEFAULT_SETTINGS.catalogFolder)
					.setValue(this.plugin.settings.catalogFolder)
					.onChange(async (v) => {
						this.plugin.settings.catalogFolder = v.trim();
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl("h3", { text: t("settings.categories.heading") });
		containerEl.createEl("p", {
			text: t("settings.categories.desc"),
			cls: "setting-item-description",
		});
		const categoriesContainer = containerEl.createDiv();
		this.renderCategories(categoriesContainer);

		containerEl.createEl("h3", { text: t("settings.packingColumns.heading") });
		containerEl.createEl("p", {
			text: t("settings.packingColumns.desc"),
			cls: "setting-item-description",
		});
		const columnsContainer = containerEl.createDiv();
		this.renderPackingColumns(columnsContainer);
	}

	private renderCategories(container: HTMLElement): void {
		container.empty();
		const { categories } = this.plugin.settings;

		for (let i = 0; i < categories.length; i++) {
			const category = categories[i];
			if (category === undefined) continue;

			const setting = new Setting(container).setName(category.name).addExtraButton((btn) =>
				btn
					.setIcon("trash")
					.setTooltip(t("settings.categories.removeTooltip"))
					.onClick(async () => {
						categories.splice(i, 1);
						await this.plugin.saveSettings();
						this.renderCategories(container);
					}),
			);

			appendCategoryDot(setting.nameEl, category.color, true);
			setting.nameEl.style.cursor = "pointer";
			setting.nameEl.setAttribute("aria-label", t("settings.categories.editHint"));
			setting.nameEl.addEventListener("click", () => {
				new CategoryEditModal(this.app, category, async (updated) => {
					if (!updated) return;

					const duplicate = categories.some((c, idx) => idx !== i && c.name === updated.name);
					if (duplicate) {
						new Notice(t("notice.categoryExists", { name: updated.name }));
						return;
					}

					categories[i] = updated;
					await this.plugin.saveSettings();
					this.renderCategories(container);
				}).open();
			});
		}

		let newCategory = "";
		new Setting(container)
			.setName(t("settings.categories.addName"))
			.addText((comp) =>
				comp.setPlaceholder(t("settings.categories.addPlaceholder")).onChange((v) => {
					newCategory = v;
				}),
			)
			.addButton((btn) =>
				btn.setButtonText(t("settings.categories.addButton")).onClick(async () => {
					const name = newCategory.trim();
					if (name && !categories.some((c) => c.name === name)) {
						categories.push({ name, color: categoryColor(name) });
						await this.plugin.saveSettings();
						this.renderCategories(container);
					}
				}),
			);
	}

	private renderPackingColumns(container: HTMLElement): void {
		container.empty();
		const { packingColumns } = this.plugin.settings;

		for (let i = 0; i < packingColumns.length; i++) {
			const column = packingColumns[i];
			if (column === undefined) continue;

			const typeLabel =
				column.type === "number"
					? t("settings.packingColumns.typeNumber")
					: t("settings.packingColumns.typeBoolean");

			new Setting(container)
				.setName(column.label)
				.setDesc(`${column.key} — ${typeLabel}`)
				.addExtraButton((btn) =>
					btn
						.setIcon("trash")
						.setTooltip(t("settings.categories.removeTooltip"))
						.onClick(async () => {
							packingColumns.splice(i, 1);
							await this.plugin.saveSettings();
							this.renderPackingColumns(container);
						}),
				);
		}

		let newLabel = "";
		let newType: PackingColumn["type"] = "boolean";
		new Setting(container)
			.setName(t("settings.packingColumns.addName"))
			.addText((comp) =>
				comp.setPlaceholder(t("settings.packingColumns.addPlaceholder")).onChange((v) => {
					newLabel = v;
				}),
			)
			.addDropdown((dd) =>
				dd
					.addOption("boolean", t("settings.packingColumns.typeBoolean"))
					.addOption("number", t("settings.packingColumns.typeNumber"))
					.setValue(newType)
					.onChange((v) => {
						newType = v as PackingColumn["type"];
					}),
			)
			.addButton((btn) =>
				btn.setButtonText(t("settings.categories.addButton")).onClick(async () => {
					const label = newLabel.trim();
					if (!label) return;

					const key = slugifyPropertyKey(label);
					if (!key || packingColumns.some((c) => c.key === key)) return;

					packingColumns.push({ key, label, type: newType });
					await this.plugin.saveSettings();
					this.renderPackingColumns(container);
				}),
			);
	}
}

class CategoryEditModal extends Modal {
	private result: CategoryConfig | null = null;
	private submitted = false;

	constructor(
		app: App,
		private category: CategoryConfig,
		private onSubmit: (result: CategoryConfig | null) => void,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: t("modal.editCategory.title") });

		let name = this.category.name;
		let color = this.category.color;

		new Setting(contentEl).setName(t("modal.editCategory.nameLabel")).addText((comp) =>
			comp.setValue(name).onChange((v) => {
				name = v;
			}),
		);

		new Setting(contentEl).setName(t("modal.editCategory.colorLabel")).addColorPicker((comp) =>
			comp.setValue(color).onChange((v) => {
				color = v;
			}),
		);

		const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
		const btn = btnContainer.createEl("button", { text: t("modal.editCategory.save"), cls: "mod-cta" });
		btn.addEventListener("click", () => {
			const trimmed = name.trim();
			if (!trimmed) return;
			this.result = { name: trimmed, color };
			this.submitted = true;
			this.close();
		});
	}

	onClose() {
		this.contentEl.empty();
		this.onSubmit(this.submitted ? this.result : null);
	}
}
