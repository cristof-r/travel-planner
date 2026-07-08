import { de } from "./de";
import { en } from "./en";

export type TranslationKey = keyof typeof en;

const LOCALES: Record<string, Record<TranslationKey, string>> = { en, de };

/**
 * Obsidian has no public i18n API for plugins. The display language the user picked
 * under Settings → General → Language is stored under this localStorage key — an
 * unofficial but widely used mechanism among community plugins.
 */
export function detectLocale(): string {
	const stored = window.localStorage.getItem("language");
	if (!stored) return "en";
	if (LOCALES[stored]) return stored;

	const base = stored.split("-")[0];
	return base && LOCALES[base] ? base : "en";
}

const activeLocale = detectLocale();

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
	const template = LOCALES[activeLocale]?.[key] ?? en[key];
	if (!vars) return template;

	return Object.entries(vars).reduce(
		(text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
		template,
	);
}
