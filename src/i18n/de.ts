import type { en } from "./en";

export const de: Record<keyof typeof en, string> = {
	"settings.title": "Reiseplaner",

	"settings.tripsFolder.name": "Reise-Ordner",
	"settings.tripsFolder.desc":
		"Wo neue Reisenotizen erstellt werden. Muss gesetzt sein, um Reisen und eine Reiseübersicht erstellen zu können.",

	"settings.catalog.heading": "Artikelkatalog",
	"settings.catalog.desc":
		'Der Katalog wird live aus einem Ordner mit Artikel-Notizen gelesen — eine Notiz pro Artikel — statt in den Plugin-Einstellungen gespeichert. Unten einen Ordner festlegen, um ihn zu aktivieren; bis dahin werden Packlisten leer erstellt. Jede Notiz braucht die Frontmatter-Eigenschaften "travel-planner-name" und "travel-planner-category" (feste Feldnamen, nicht konfigurierbar) — die Kategorie kann ein einzelner Wert oder eine Liste sein, da ein Artikel mehreren Kategorien angehören kann. Notizen in diesem Ordner hinzufügen, bearbeiten oder löschen (oder den Befehl "Packartikel-Notiz erstellen" verwenden), um den Katalog zu ändern.',

	"settings.catalogFolder.name": "Katalog-Ordner",
	"settings.catalogFolder.desc": "Ordner mit einer Notiz pro Katalogartikel.",

	"settings.categories.heading": "Kategorien",
	"settings.categories.desc":
		"Bestimmt die Anzeigereihenfolge beim Erstellen einer Packliste. Jede Kategorie, die im Katalog vorkommt, hier aber fehlt, wird trotzdem am Ende angehängt.",
	"settings.categories.addName": "Kategorie hinzufügen",
	"settings.categories.addPlaceholder": "z. B. Camping",
	"settings.categories.addButton": "Hinzufügen",
	"settings.categories.removeTooltip": "Entfernen",
	"settings.categories.editHint": "Klicken, um Name und Farbe zu bearbeiten",

	"settings.packingColumns.heading": "Packstatus-Spalten",
	"settings.packingColumns.desc":
		"Ja/Nein- oder Zahl-Spalten (z. B. Gepackt, Gekauft), die in der generierten Packtabelle jeder Reise angezeigt werden, zusätzlich zu einer festen Anzahl-Spalte (wie viele des Artikels für die Reise benötigt werden). Jede wird zu einer bearbeitbaren Spalte in der Tabelle — ein Kontrollkästchen für Ja/Nein, ein Zahlenfeld für Zahl — und aktualisiert die Notiz des jeweiligen Artikels direkt. Der Typ einer Spalte kann nachträglich nicht geändert werden; stattdessen entfernen und neu hinzufügen.",
	"settings.packingColumns.addName": "Spalte hinzufügen",
	"settings.packingColumns.addPlaceholder": "z. B. Gekauft",
	"settings.packingColumns.typeBoolean": "Ja/Nein",
	"settings.packingColumns.typeNumber": "Zahl",

	"command.createTrip": "Reise mit Packliste erstellen",
	"command.insertPackingList": "Packliste in aktuelle Notiz einfügen",
	"command.resetPackingList": "Packliste in aktueller Notiz zurücksetzen",
	"command.createPackingItem": "Packartikel-Notiz erstellen",
	"command.createTripsOverview": "Reiseübersicht erstellen",
	"command.createCatalogOverview": "Katalogübersicht erstellen",
	"command.createExampleData": "Beispieldaten erstellen",

	"modal.tripName.title": "Reisename",
	"modal.tripName.placeholder": "z. B. Lissabon 2026",
	"modal.tripName.button": "Weiter",

	"modal.category.title": "Kategorien",
	"modal.category.placeholder": "z. B. Kleidung, Sport",
	"modal.category.button": "Artikel hinzufügen",

	"modal.itemName.title": "Artikelname",
	"modal.itemName.placeholder": "z. B. Sonnencreme",
	"modal.itemName.button": "Weiter",

	"modal.categoryPicker.title": "Kategorien auswählen",
	"modal.categoryPicker.button": "Erstellen",

	"modal.editCategory.title": "Kategorie bearbeiten",
	"modal.editCategory.nameLabel": "Name",
	"modal.editCategory.colorLabel": "Farbe",
	"modal.editCategory.save": "Speichern",

	"notice.noActiveFile": "Keine aktive Notiz.",
	"notice.tripExists": '"{{name}}" existiert bereits in {{folder}}.',
	"notice.tripCreated": "Reise erstellt: {{name}}",
	"notice.packingListInserted": "Packliste eingefügt.",
	"notice.noPackingList": "Keine Packliste in dieser Notiz gefunden.",
	"notice.packingListReset": "Packliste zurückgesetzt.",
	"notice.itemExists": '"{{name}}" existiert bereits in {{folder}}.',
	"notice.itemAdded": '"{{name}}" wurde zum Katalog hinzugefügt.',
	"notice.tripsOverviewExists": "Eine Reiseübersicht existiert bereits in {{folder}}.",
	"notice.tripsOverviewCreated": "Reiseübersicht in {{folder}} erstellt.",
	"notice.catalogOverviewExists": "Eine Katalogübersicht existiert bereits in {{folder}}.",
	"notice.catalogOverviewCreated": "Katalogübersicht in {{folder}} erstellt.",
	"notice.catalogNotConfigured": "Zuerst einen Katalog-Ordner in den Reiseplaner-Einstellungen festlegen.",
	"notice.tripsFolderNotConfigured": "Zuerst einen Reise-Ordner in den Reiseplaner-Einstellungen festlegen.",
	"notice.exampleDataCreated": "{{items}} Beispiel-Katalogartikel erstellt. Beispielreise geöffnet.",
	"notice.categoryExists": 'Eine Kategorie namens "{{name}}" existiert bereits.',
};
