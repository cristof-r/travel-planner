import { beforeEach, describe, expect, it, vi } from "vitest";

// t()'s active locale is computed once at module load from window.localStorage,
// so each test re-imports the module fresh after shimming a different value.
async function loadI18n(language: string | null) {
	vi.resetModules();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any).window = { localStorage: { getItem: () => language } };
	return import("../src/i18n");
}

describe("i18n", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("falls back to English when no language is set", async () => {
		const { t } = await loadI18n(null);
		expect(t("settings.title")).toBe("Travel Planner");
	});

	it("uses the matching locale when supported", async () => {
		const { t } = await loadI18n("de");
		expect(t("settings.title")).toBe("Reiseplaner");
	});

	it("falls back to the base language for regional variants (e.g. de-CH)", async () => {
		const { t } = await loadI18n("de-CH");
		expect(t("settings.title")).toBe("Reiseplaner");
	});

	it("falls back to English for an unsupported language", async () => {
		const { t } = await loadI18n("fr");
		expect(t("settings.title")).toBe("Travel Planner");
	});

	it("interpolates variables into the translated template", async () => {
		const { t } = await loadI18n("en");
		expect(t("notice.tripCreated", { name: "Lisbon 2026" })).toBe("Created trip: Lisbon 2026");
	});
});
